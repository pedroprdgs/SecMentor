const checksum = crypto.createHash("sha256").update(asset).digest("hex");
