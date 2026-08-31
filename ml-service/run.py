import os
import socket


def resolve_port(preferred_port: int) -> int:
    """Return the preferred port unless it is already in use, then select the next free one."""
    port = preferred_port
    while True:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind(("0.0.0.0", port))
                return port
            except OSError:
                port += 1
                if port > preferred_port + 20:
                    raise RuntimeError(
                        f"Unable to find a free port near {preferred_port}. "
                        "Please set ML_SERVICE_PORT to a specific unused port."
                    )


if __name__ == "__main__":
    preferred_port = int(os.environ.get("ML_SERVICE_PORT", 8001))
    port = resolve_port(preferred_port)
    os.environ["ML_SERVICE_PORT"] = str(port)
    print(f"Starting ML service on port {port} (preferred: {preferred_port})")

    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
