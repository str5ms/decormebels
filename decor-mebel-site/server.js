const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const dataFile = path.join(root, "leads.json");
const port = Number(process.env.PORT || 4173);
const host = "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png"
};

function readLeads() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch {
    return [];
  }
}

function writeLeads(leads) {
  fs.writeFileSync(dataFile, JSON.stringify(leads, null, 2));
}

function readBody(request) {
  return new Promise((resolve) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) request.destroy();
    });
    request.on("end", () => resolve(body));
  });
}

function send(response, status, body, type = "application/json; charset=utf-8") {
  response.writeHead(status, { "Content-Type": type });
  response.end(body);
}

function sendJson(response, status, value) {
  send(response, status, JSON.stringify(value), "application/json; charset=utf-8");
}

function cleanLead(value) {
  return {
    id: value.id || String(Date.now()),
    createdAt: value.createdAt || new Date().toISOString(),
    status: value.status || "new",
    name: String(value.name || "").slice(0, 120),
    phone: String(value.phone || "").slice(0, 60),
    project: String(value.project || "").slice(0, 120),
    budget: String(value.budget || "").slice(0, 80),
    message: String(value.message || "").slice(0, 2000)
  };
}

async function handleApi(request, response, url) {
  if (url.pathname === "/api/leads" && request.method === "GET") {
    sendJson(response, 200, readLeads());
    return true;
  }

  if (url.pathname === "/api/leads" && request.method === "POST") {
    const lead = cleanLead(JSON.parse((await readBody(request)) || "{}"));
    const leads = readLeads();
    leads.unshift(lead);
    writeLeads(leads);
    sendJson(response, 201, lead);
    return true;
  }

  if (url.pathname === "/api/leads" && request.method === "DELETE") {
    writeLeads([]);
    sendJson(response, 200, { ok: true });
    return true;
  }

  const match = url.pathname.match(/^\/api\/leads\/(.+)$/);
  if (match && request.method === "PATCH") {
    const id = decodeURIComponent(match[1]);
    const patch = cleanLead(JSON.parse((await readBody(request)) || "{}"));
    const leads = readLeads().map((lead) => (lead.id === id ? { ...lead, ...patch, id } : lead));
    writeLeads(leads);
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (match && request.method === "DELETE") {
    const id = decodeURIComponent(match[1]);
    writeLeads(readLeads().filter((lead) => lead.id !== id));
    sendJson(response, 200, { ok: true });
    return true;
  }

  return false;
}

function serveFile(response, url) {
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(root, requested));
  if (!filePath.startsWith(root)) {
    send(response, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(response, 404, "Not found", "text/plain; charset=utf-8");
      return;
    }
    send(response, 200, data, types[path.extname(filePath)] || "application/octet-stream");
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/") && await handleApi(request, response, url)) return;
    serveFile(response, url);
  } catch (error) {
    sendJson(response, 500, { error: "Server error" });
  }
});

server.listen(port, host, () => {
  console.log(`Decor Mebel KZ site: http://${host}:${port}`);
});
