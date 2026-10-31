cors({ origin: "https://app.example.com", credentials: true });
res.cookie("session", value, { httpOnly: true, secure: true, sameSite: "lax" });
