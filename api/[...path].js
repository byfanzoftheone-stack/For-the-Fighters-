function getBackendBaseUrl() {
  const value = (process.env.RAILWAY_API_BASE_URL || "").trim();
  return value.replace(/\/+$/, "");
}

function buildTargetUrl(baseUrl, pathSegments, query) {
  const safeSegments = pathSegments.map((segment) => encodeURIComponent(segment));
  const path = safeSegments.join("/");
  const url = new URL(`${baseUrl}/${path}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (key === "path") {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => url.searchParams.append(key, String(entry)));
      return;
    }
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

module.exports = async function handler(req, res) {
  const backendBaseUrl = getBackendBaseUrl();
  if (!backendBaseUrl) {
    res.status(500).json({
      error: "RAILWAY_API_BASE_URL is not configured in Vercel environment variables.",
    });
    return;
  }

  const pathParam = req.query.path;
  const pathSegments = Array.isArray(pathParam)
    ? pathParam
    : pathParam
      ? [pathParam]
      : [];

  const targetUrl = buildTargetUrl(backendBaseUrl, pathSegments, req.query);
  const headers = {};

  if (req.headers["content-type"]) {
    headers["content-type"] = req.headers["content-type"];
  }
  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }

  const options = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
      options.body = req.body;
    } else if (req.body && Object.keys(req.body).length > 0) {
      options.body = JSON.stringify(req.body);
      if (!headers["content-type"]) {
        headers["content-type"] = "application/json";
      }
    }
  }

  try {
    const upstream = await fetch(targetUrl, options);
    const text = await upstream.text();

    res.status(upstream.status);
    const contentType = upstream.headers.get("content-type");
    if (contentType) {
      res.setHeader("content-type", contentType);
    }
    res.send(text);
  } catch (error) {
    res.status(502).json({
      error: "Failed to reach Railway backend.",
      detail: error.message || "Unknown proxy error",
      target: targetUrl.toString(),
    });
  }
};
