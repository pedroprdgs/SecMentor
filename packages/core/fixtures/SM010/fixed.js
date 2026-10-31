const user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"], maxAge: "15m" });
