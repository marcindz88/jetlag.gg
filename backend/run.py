import uvicorn

PORT = 9999

if __name__ == "__main__":
    print(f"SERVER STARTING ON PORT {PORT}...")
    uvicorn.run("app.api.server:app", host="0.0.0.0", port=PORT, log_level="info", reload=True)
