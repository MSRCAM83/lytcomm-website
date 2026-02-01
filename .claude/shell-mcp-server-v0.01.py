#!/usr/bin/env python3
"""
VAST.AI SHELL MCP SERVER v0.01
Full OS-level control via Model Context Protocol (streamable-http)
Runs on port 9001 alongside ComfyUI MCP (port 9000)
Endpoint: https://shell.comfyui-mcp.uk/mcp

Tools:
  run_command     - Execute any bash command with timeout + cwd
  read_file       - Read text or binary files
  write_file      - Create/overwrite files
  append_file     - Append to existing files
  list_directory  - Recursive directory listing with sizes
  file_info       - Stat/permissions/ownership details
  delete_path     - Remove files or directories
  move_path       - Move/rename files or directories
  upload_base64   - Write binary content from base64
  download_base64 - Read binary content as base64
  process_list    - List running processes (filterable)
  kill_process    - Kill a process by PID or name
  disk_usage      - Disk space and directory sizes
  system_info     - Full system summary (CPU, RAM, GPU, disk, OS)
  gpu_info        - Detailed nvidia-smi output
  install_package - pip/apt install with output
  environment     - Get/set environment variables
"""

import asyncio
import base64
import json
import logging
import os
import platform
import shutil
import signal
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("ShellMCP")

# ─── Server Init ─────────────────────────────────────────────────────────────
mcp = FastMCP(
    name="shell-mcp-server",
    version="0.1.0",
    description="Full OS-level shell access for Vast.ai GPU instances",
    host="0.0.0.0",
    port=9001,
)

# ─── Tool: run_command ───────────────────────────────────────────────────────
@mcp.tool(
    name="run_command",
    description="Execute a bash command. Returns stdout, stderr, exit_code. "
                "Supports timeout (default 300s) and working directory.",
)
def run_command(
    command: str,
    timeout: int = 300,
    cwd: Optional[str] = None,
) -> dict:
    """Execute a shell command and return results."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=cwd or None,
            env={**os.environ},
        )
        return {
            "stdout": result.stdout[-50000:] if len(result.stdout) > 50000 else result.stdout,
            "stderr": result.stderr[-10000:] if len(result.stderr) > 10000 else result.stderr,
            "exit_code": result.returncode,
            "truncated": len(result.stdout) > 50000,
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": f"Command timed out after {timeout}s", "exit_code": -1, "truncated": False}
    except Exception as e:
        return {"stdout": "", "stderr": str(e), "exit_code": -1, "truncated": False}


# ─── Tool: read_file ────────────────────────────────────────────────────────
@mcp.tool(
    name="read_file",
    description="Read a file's contents. Text files return content directly. "
                "Binary files return base64. Use offset/limit for large files.",
)
def read_file(
    path: str,
    offset: int = 0,
    limit: int = 100000,
    encoding: str = "utf-8",
) -> dict:
    """Read file contents with optional offset and limit (in bytes)."""
    p = Path(path)
    if not p.exists():
        return {"error": f"File not found: {path}"}
    if not p.is_file():
        return {"error": f"Not a file: {path}"}

    size = p.stat().st_size
    try:
        with open(p, "r", encoding=encoding) as f:
            if offset:
                f.seek(offset)
            content = f.read(limit)
        return {
            "content": content,
            "size": size,
            "offset": offset,
            "encoding": encoding,
            "truncated": size > offset + limit,
        }
    except UnicodeDecodeError:
        with open(p, "rb") as f:
            if offset:
                f.seek(offset)
            raw = f.read(min(limit, 5_000_000))
        return {
            "content_base64": base64.b64encode(raw).decode("ascii"),
            "size": size,
            "offset": offset,
            "encoding": "binary/base64",
            "truncated": size > offset + len(raw),
        }


# ─── Tool: write_file ───────────────────────────────────────────────────────
@mcp.tool(
    name="write_file",
    description="Create or overwrite a file with text content. Creates parent directories automatically.",
)
def write_file(path: str, content: str, encoding: str = "utf-8") -> dict:
    """Write text content to a file."""
    try:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding=encoding)
        return {"success": True, "path": str(p), "size": p.stat().st_size}
    except Exception as e:
        return {"error": str(e)}


# ─── Tool: append_file ──────────────────────────────────────────────────────
@mcp.tool(
    name="append_file",
    description="Append text content to an existing file (or create it).",
)
def append_file(path: str, content: str, encoding: str = "utf-8") -> dict:
    """Append content to a file."""
    try:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        with open(p, "a", encoding=encoding) as f:
            f.write(content)
        return {"success": True, "path": str(p), "size": p.stat().st_size}
    except Exception as e:
        return {"error": str(e)}


# ─── Tool: list_directory ───────────────────────────────────────────────────
@mcp.tool(
    name="list_directory",
    description="List directory contents with file sizes, types, and permissions. "
                "Supports recursive listing with depth control.",
)
def list_directory(
    path: str = ".",
    recursive: bool = False,
    max_depth: int = 2,
    show_hidden: bool = False,
) -> dict:
    """List directory entries with metadata."""
    p = Path(path)
    if not p.exists():
        return {"error": f"Path not found: {path}"}
    if not p.is_dir():
        return {"error": f"Not a directory: {path}"}

    entries = []
    def _scan(dir_path: Path, depth: int):
        if depth > max_depth:
            return
        try:
            for item in sorted(dir_path.iterdir()):
                if not show_hidden and item.name.startswith("."):
                    continue
                try:
                    stat = item.stat()
                    entry = {
                        "name": str(item.relative_to(p)),
                        "type": "dir" if item.is_dir() else "file",
                        "size": stat.st_size if item.is_file() else None,
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    }
                    entries.append(entry)
                    if item.is_dir() and recursive and depth < max_depth:
                        _scan(item, depth + 1)
                except (PermissionError, OSError):
                    entries.append({"name": str(item.relative_to(p)), "type": "error", "error": "permission denied"})
        except PermissionError:
            pass

    _scan(p, 0)
    # Limit to 500 entries to avoid massive responses
    truncated = len(entries) > 500
    return {"path": str(p.resolve()), "entries": entries[:500], "count": len(entries), "truncated": truncated}


# ─── Tool: file_info ────────────────────────────────────────────────────────
@mcp.tool(
    name="file_info",
    description="Get detailed file/directory info: size, permissions, owner, timestamps.",
)
def file_info(path: str) -> dict:
    """Get detailed stat info for a path."""
    p = Path(path)
    if not p.exists():
        return {"error": f"Path not found: {path}"}
    try:
        stat = p.stat()
        return {
            "path": str(p.resolve()),
            "type": "directory" if p.is_dir() else ("symlink" if p.is_symlink() else "file"),
            "size": stat.st_size,
            "size_human": _human_size(stat.st_size),
            "permissions": oct(stat.st_mode)[-3:],
            "owner_uid": stat.st_uid,
            "group_gid": stat.st_gid,
            "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "accessed": datetime.fromtimestamp(stat.st_atime).isoformat(),
        }
    except Exception as e:
        return {"error": str(e)}


# ─── Tool: delete_path ──────────────────────────────────────────────────────
@mcp.tool(
    name="delete_path",
    description="Delete a file or directory (with recursive option for directories).",
)
def delete_path(path: str, recursive: bool = False) -> dict:
    """Delete a file or directory."""
    p = Path(path)
    if not p.exists():
        return {"error": f"Path not found: {path}"}
    try:
        if p.is_file() or p.is_symlink():
            p.unlink()
        elif p.is_dir():
            if recursive:
                shutil.rmtree(p)
            else:
                p.rmdir()  # only works if empty
        return {"success": True, "deleted": str(p)}
    except Exception as e:
        return {"error": str(e)}


# ─── Tool: move_path ────────────────────────────────────────────────────────
@mcp.tool(
    name="move_path",
    description="Move or rename a file/directory.",
)
def move_path(source: str, destination: str) -> dict:
    """Move or rename a path."""
    try:
        src = Path(source)
        dst = Path(destination)
        if not src.exists():
            return {"error": f"Source not found: {source}"}
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dst))
        return {"success": True, "source": str(src), "destination": str(dst)}
    except Exception as e:
        return {"error": str(e)}


# ─── Tool: upload_base64 ────────────────────────────────────────────────────
@mcp.tool(
    name="upload_base64",
    description="Write binary content to a file from base64-encoded string. "
                "Use this for pushing scripts, images, or any binary data.",
)
def upload_base64(path: str, b64_content: str) -> dict:
    """Write base64-decoded binary content to a file."""
    try:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        data = base64.b64decode(b64_content)
        p.write_bytes(data)
        return {"success": True, "path": str(p), "size": len(data)}
    except Exception as e:
        return {"error": str(e)}


# ─── Tool: download_base64 ──────────────────────────────────────────────────
@mcp.tool(
    name="download_base64",
    description="Read a file and return its content as base64. Max 10MB. "
                "Use for pulling binaries, images, or non-text files.",
)
def download_base64(path: str) -> dict:
    """Read a file as base64."""
    p = Path(path)
    if not p.exists():
        return {"error": f"File not found: {path}"}
    size = p.stat().st_size
    if size > 10_000_000:
        return {"error": f"File too large: {_human_size(size)} (max 10MB)"}
    try:
        data = p.read_bytes()
        return {
            "content_base64": base64.b64encode(data).decode("ascii"),
            "size": size,
            "path": str(p.resolve()),
        }
    except Exception as e:
        return {"error": str(e)}


# ─── Tool: process_list ─────────────────────────────────────────────────────
@mcp.tool(
    name="process_list",
    description="List running processes. Optional filter by name/command string.",
)
def process_list(filter_str: Optional[str] = None) -> dict:
    """List processes, optionally filtered."""
    try:
        result = subprocess.run(
            ["ps", "aux", "--sort=-pcpu"],
            capture_output=True, text=True, timeout=10,
        )
        lines = result.stdout.strip().split("\n")
        header = lines[0] if lines else ""
        processes = []
        for line in lines[1:]:
            if filter_str and filter_str.lower() not in line.lower():
                continue
            parts = line.split(None, 10)
            if len(parts) >= 11:
                processes.append({
                    "user": parts[0], "pid": parts[1], "cpu": parts[2],
                    "mem": parts[3], "vsz": parts[4], "rss": parts[5],
                    "command": parts[10],
                })
        return {"header": header, "processes": processes[:100], "count": len(processes)}
    except Exception as e:
        return {"error": str(e)}


# ─── Tool: kill_process ─────────────────────────────────────────────────────
@mcp.tool(
    name="kill_process",
    description="Kill a process by PID or by name pattern (pkill).",
)
def kill_process(
    pid: Optional[int] = None,
    name: Optional[str] = None,
    signal_num: int = 15,
) -> dict:
    """Kill a process by PID or name."""
    try:
        if pid:
            os.kill(pid, signal_num)
            return {"success": True, "killed_pid": pid, "signal": signal_num}
        elif name:
            result = subprocess.run(
                ["pkill", f"-{signal_num}", "-f", name],
                capture_output=True, text=True, timeout=10,
            )
            return {
                "success": result.returncode == 0,
                "pattern": name,
                "signal": signal_num,
                "stderr": result.stderr.strip() if result.stderr else None,
            }
        else:
            return {"error": "Provide either pid or name"}
    except ProcessLookupError:
        return {"error": f"Process {pid} not found"}
    except Exception as e:
        return {"error": str(e)}


# ─── Tool: disk_usage ───────────────────────────────────────────────────────
@mcp.tool(
    name="disk_usage",
    description="Show disk space (df) and optionally directory sizes (du) for specific paths.",
)
def disk_usage(path: str = "/", show_du: bool = False, du_depth: int = 1) -> dict:
    """Get disk usage information."""
    try:
        # df
        result = subprocess.run(["df", "-h", path], capture_output=True, text=True, timeout=10)
        df_output = result.stdout.strip()

        # du
        du_output = None
        if show_du:
            result = subprocess.run(
                ["du", "-h", f"--max-depth={du_depth}", path],
                capture_output=True, text=True, timeout=30,
            )
            du_output = result.stdout.strip()[-5000:]  # limit output

        # statvfs for programmatic access
        stat = os.statvfs(path)
        total = stat.f_blocks * stat.f_frsize
        free = stat.f_bfree * stat.f_frsize
        used = total - free

        return {
            "df": df_output,
            "du": du_output,
            "total": _human_size(total),
            "used": _human_size(used),
            "free": _human_size(free),
            "percent_used": round(used / total * 100, 1) if total > 0 else 0,
        }
    except Exception as e:
        return {"error": str(e)}


# ─── Tool: system_info ──────────────────────────────────────────────────────
@mcp.tool(
    name="system_info",
    description="Full system summary: hostname, OS, CPU, RAM, GPU, disk, uptime, Python version.",
)
def system_info() -> dict:
    """Get comprehensive system information."""
    info = {}
    try:
        info["hostname"] = platform.node()
        info["os"] = f"{platform.system()} {platform.release()}"
        info["python"] = platform.python_version()
        info["arch"] = platform.machine()

        # CPU
        try:
            with open("/proc/cpuinfo") as f:
                cpuinfo = f.read()
            cores = cpuinfo.count("processor\t:")
            model = ""
            for line in cpuinfo.split("\n"):
                if "model name" in line:
                    model = line.split(":")[1].strip()
                    break
            info["cpu"] = {"model": model, "cores": cores}
        except:
            info["cpu"] = "unknown"

        # RAM
        try:
            with open("/proc/meminfo") as f:
                meminfo = f.read()
            for line in meminfo.split("\n"):
                if "MemTotal" in line:
                    kb = int(line.split()[1])
                    info["ram_total"] = _human_size(kb * 1024)
                elif "MemAvailable" in line:
                    kb = int(line.split()[1])
                    info["ram_available"] = _human_size(kb * 1024)
        except:
            pass

        # GPU
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=name,memory.total,memory.used,memory.free,temperature.gpu,utilization.gpu",
                 "--format=csv,noheader,nounits"],
                capture_output=True, text=True, timeout=10,
            )
            if result.returncode == 0:
                gpus = []
                for line in result.stdout.strip().split("\n"):
                    parts = [p.strip() for p in line.split(",")]
                    if len(parts) >= 6:
                        gpus.append({
                            "name": parts[0],
                            "vram_total_mb": parts[1],
                            "vram_used_mb": parts[2],
                            "vram_free_mb": parts[3],
                            "temp_c": parts[4],
                            "utilization_pct": parts[5],
                        })
                info["gpus"] = gpus
        except:
            info["gpus"] = "nvidia-smi not available"

        # Disk
        stat = os.statvfs("/")
        total = stat.f_blocks * stat.f_frsize
        free = stat.f_bfree * stat.f_frsize
        info["disk"] = {"total": _human_size(total), "free": _human_size(free)}

        # Uptime
        try:
            with open("/proc/uptime") as f:
                up_seconds = float(f.read().split()[0])
            hours = int(up_seconds // 3600)
            minutes = int((up_seconds % 3600) // 60)
            info["uptime"] = f"{hours}h {minutes}m"
        except:
            pass

    except Exception as e:
        info["error"] = str(e)

    return info


# ─── Tool: gpu_info ─────────────────────────────────────────────────────────
@mcp.tool(
    name="gpu_info",
    description="Full nvidia-smi output — GPU name, VRAM, temp, utilization, processes.",
)
def gpu_info() -> dict:
    """Get detailed GPU information."""
    try:
        result = subprocess.run(
            ["nvidia-smi"],
            capture_output=True, text=True, timeout=10,
        )
        return {"output": result.stdout, "exit_code": result.returncode}
    except FileNotFoundError:
        return {"error": "nvidia-smi not found"}
    except Exception as e:
        return {"error": str(e)}


# ─── Tool: install_package ──────────────────────────────────────────────────
@mcp.tool(
    name="install_package",
    description="Install a package via pip or apt. Returns full install output.",
)
def install_package(
    package: str,
    manager: str = "pip",
    extra_args: Optional[str] = None,
) -> dict:
    """Install a package using pip or apt."""
    if manager == "pip":
        cmd = f"pip install {package} --break-system-packages"
    elif manager == "apt":
        cmd = f"apt-get update -qq && apt-get install -y {package}"
    else:
        return {"error": f"Unknown package manager: {manager}. Use 'pip' or 'apt'."}

    if extra_args:
        cmd += f" {extra_args}"

    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=300,
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout[-10000:],
            "stderr": result.stderr[-5000:],
            "exit_code": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"error": f"Install timed out after 300s"}
    except Exception as e:
        return {"error": str(e)}


# ─── Tool: environment ──────────────────────────────────────────────────────
@mcp.tool(
    name="environment",
    description="Get or set environment variables. "
                "Call with just 'name' to get, with 'name' and 'value' to set.",
)
def environment(
    name: Optional[str] = None,
    value: Optional[str] = None,
    list_all: bool = False,
) -> dict:
    """Get/set environment variables."""
    if list_all:
        # Return filtered env (skip huge vars)
        env = {}
        for k, v in sorted(os.environ.items()):
            env[k] = v[:200] + "..." if len(v) > 200 else v
        return {"environment": env, "count": len(env)}
    elif name and value is not None:
        os.environ[name] = value
        return {"set": name, "value": value}
    elif name:
        val = os.environ.get(name)
        return {"name": name, "value": val, "exists": val is not None}
    else:
        return {"error": "Provide 'name' to get/set, or list_all=True"}


# ─── Helpers ─────────────────────────────────────────────────────────────────
def _human_size(nbytes: int) -> str:
    """Convert bytes to human-readable string."""
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if abs(nbytes) < 1024:
            return f"{nbytes:.1f}{unit}"
        nbytes /= 1024
    return f"{nbytes:.1f}PB"


# ─── Main ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 70)
    print("              [*] Shell MCP Server v0.01")
    print("=" * 70)
    print(f"  Port: 9001")
    print(f"  Transport: streamable-http")
    print(f"  Endpoint: http://0.0.0.0:9001/mcp")
    print(f"  Tools: {len(mcp._tool_manager._tools) if hasattr(mcp, '_tool_manager') else '?'}")
    print("=" * 70)

    # Disable DNS rebinding protection for Cloudflare tunnel access
    mcp.settings.transport_security = TransportSecuritySettings(
        enable_dns_rebinding_protection=False
    )
    mcp.run(transport="streamable-http")
