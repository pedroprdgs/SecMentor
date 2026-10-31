cors({ origin: "*", credentials: false });
res.cookie("prefs", value, { httpOnly: true, secure: true });
