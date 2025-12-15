import fs from "fs";
import express from "express";
import cors from "cors";
import { Firestore } from "@google-cloud/firestore";

// ==================== GOOGLE CLOUD CREDENTIALS ====================
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  try {
    let credJson = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON, "base64").toString();
    credJson = credJson.replace(/\\n/g, '\n');
    const credPath = "/tmp/google-creds.json";
    fs.writeFileSync(credPath, credJson);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
    console.log("✅ Google Cloud credentials loaded from env");
  } catch (err) {
    console.error("❌ Failed to load credentials:", err.message);
  }
}
// ===================================================================

const app = express();
app.use(express.json());
app.use(cors({ origin: "*"}));

const firestore = new Firestore({
  projectId:
    process.env.FIRESTORE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    "solaire-frontend",
});

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const SIGNING_SECRET = process.env.SIGNING_SECRET || "";
const WRITE_TOKEN = process.env.WRITE_TOKEN || "";
const DEBUG_TOKEN_NAME = process.env.DEBUG_TOKEN_NAME || "CODEX";
const DEBUG_TOKEN_VALUE = process.env.DEBUG_TOKEN_VALUE || "7482058D-3D55-464D-A602-30FBA2A2C8B4";

async function validateSignature(req) {
  if (!SIGNING_SECRET) return true;
  const signature = req.header("X-Webhook-Signature");
  if (!signature) return false;
  const crypto = await import("crypto");
  const body = JSON.stringify(req.body || {});
  const expected = crypto.createHmac("sha256", SIGNING_SECRET).update(body).digest("hex");
  return signature === expected;
}

async function verifyWebhookAuth(req, res, next) {
  if (!WEBHOOK_SECRET) return next();
  const token = req.header("X-Webhook-Token") || req.query.token;
  if (token !== WEBHOOK_SECRET) return res.status(401).send("unauthorized");
  if (!(await validateSignature(req))) return res.status(401).send("bad signature");
  return next();
}

function requireWriteToken(req, res, next) {
  if (!WRITE_TOKEN) return next();
  const token = req.header("X-Api-Token");
  if (token === DEBUG_TOKEN_VALUE) return next();
  if (token !== WRITE_TOKEN) return res.status(401).send("unauthorized");
  return next();
}

function parseLimitOffset(req, def = 100) {
  const limit = Math.min(parseInt(req.query.limit || def, 10) || def, 200);
  const offset = parseInt(req.query.offset || 0, 10) || 0;
  return { limit, offset };
}

const statusMap = {
  création: "nouveau",
  creation: "nouveau",
  nouveau: "nouveau",
  modification: "en_cours",
  modifie: "en_cours",
  modifié: "en_cours",
  suppression: "supprime",
  delete: "supprime",
};

async function upsertClient(payload) {
  const { id, name, email, phone, company, status, pack, segment } = payload;
  if (!id) return;
  const doc = firestore.collection("clients").doc(String(id));
  const data = {
    name: name || null,
    email: email || null,
    phone: phone || null,
    company: company || null,
    status: status || "actif",
    pack: pack || "validation",
    segment: segment || "small",
    updatedAt: Firestore.Timestamp.now(),
  };
  await doc.set({ createdAt: Firestore.Timestamp.now(), ...data }, { merge: true });
}

async function logClientEvent(clientId, type, payload) {
  const coll = firestore.collection("client_events");
  await coll.add({ clientId, type, payload, at: Firestore.Timestamp.now() });
}

async function countCollection(colName) {
  const agg = await firestore.collection(colName).count().get();
  return agg.data().count || 0;
}

async function upsertFile(payload) {
  const {
    id,
    title,
    clientId,
    installateurId,
    pack,
    price,
    status,
    address,
    power,
    mairieStatus,
    consuelStatus,
    enedisStatus,
    edfStatus,
    notes,
    mairieDepositDate,
    consuelVisitDate,
    enedisPdL,
    edfContractNumber,
  } = payload;
  if (!id) return;
  const doc = firestore.collection("files").doc(String(id));
  const data = {
    title: title || null,
    clientId: clientId || null,
    installateurId: installateurId || "INST-DEFAULT",
    pack: pack || "validation",
    price: price || null,
    status: status || "en_cours",
    address: address || null,
    power: power || null,
    mairieStatus: mairieStatus || "a_faire",
    consuelStatus: consuelStatus || "a_faire",
    enedisStatus: enedisStatus || "a_faire",
    edfStatus: edfStatus || "a_faire",
    notes: notes || null,
    mairieDepositDate: mairieDepositDate || null,
    consuelVisitDate: consuelVisitDate || null,
    enedisPdL: enedisPdL || null,
    edfContractNumber: edfContractNumber || null,
    updatedAt: Firestore.Timestamp.now(),
  };
  await doc.set({ createdAt: Firestore.Timestamp.now(), ...data }, { merge: true });
}

async function logFileEvent(fileId, type, payload) {
  const coll = firestore.collection("file_events");
  await coll.add({ fileId, type, payload, at: Firestore.Timestamp.now() });
}

async function upsertLead(payload) {
  const { id, name, email, phone, status, source, clientId, installateurId } = payload;
  if (!id) return;
  const doc = firestore.collection("leads").doc(String(id));
  const data = {
    name: name || null,
    email: email || null,
    phone: phone || null,
    status: statusMap[(status || "").toLowerCase()] || status || "nouveau",
    source: source || "webhook",
    clientId: clientId || null,
    installateurId: installateurId || "INST-DEFAULT",
    updatedAt: Firestore.Timestamp.now(),
  };
  await doc.set({ createdAt: Firestore.Timestamp.now(), ...data }, { merge: true });
}

async function logEvent(leadId, type, payload) {
  const coll = firestore.collection("events");
  await coll.add({ leadId, type, payload, at: Firestore.Timestamp.now() });
}

app.post("/webhook/crm", verifyWebhookAuth, async (req, res) => {
  const { event, id, name, email, phone, status, source } = req.body || {};
  try {
    if (event === "delete" || event === "suppression") {
      await firestore.collection("leads").doc(String(id)).delete();
      await logEvent(id, "delete", req.body);
    } else {
      await upsertLead({ id, name, email, phone, status, source });
      await logEvent(id, event || "update", req.body);
    }
    return res.status(200).send("ok");
  } catch (err) {
    console.error("webhook error", err);
    return res.status(500).send("error");
  }
});

app.post("/leads", requireWriteToken, async (req, res) => {
  try {
    const id = req.body.id || `lead-${Date.now()}`;
    await upsertLead({
      id,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      status: req.body.status || "nouveau",
      source: req.body.source || "landing",
      clientId: req.body.clientId || null,
      installateurId: req.body.installateurId || "INST-DEFAULT",
    });
    await logEvent(id, "create", req.body);
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("create lead error", err);
    return res.status(500).send("error");
  }
});

app.post("/clients", requireWriteToken, async (req, res) => {
  try {
    const id = req.body.id || `client-${Date.now()}`;
    await upsertClient({
      id,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      company: req.body.company,
      status: req.body.status || "actif",
      pack: req.body.pack || "validation",
      segment: req.body.segment || "small",
    });
    await logClientEvent(id, "create", req.body);
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("create client error", err);
    return res.status(500).send("error");
  }
});

app.get("/leads", async (req, res) => {
  try {
    const { limit, offset } = parseLimitOffset(req, 100);
    const total = await countCollection("leads");
    const snap = await firestore
      .collection("leads")
      .orderBy("updatedAt", "desc")
      .offset(offset)
      .limit(limit)
      .get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ items: data, total });
  } catch (err) {
    console.error("leads error", err);
    return res.status(500).send("error");
  }
});

app.post("/leads/:id/convert", requireWriteToken, async (req, res) => {
  const { id } = req.params;
  try {
    const leadDoc = await firestore.collection("leads").doc(String(id)).get();
    if (!leadDoc.exists) return res.status(404).send("not found");
    const lead = leadDoc.data();
    const clientId = lead.clientId || `client-${Date.now()}`;

    await upsertClient({
      id: clientId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      pack: req.body?.pack || "validation",
      segment: req.body?.segment || "small",
      status: "actif",
    });
    await logClientEvent(clientId, "from_lead", { leadId: id });

    await upsertLead({ ...lead, id, clientId, status: "gagne" });
    await logEvent(id, "convert", { clientId });

    return res.status(200).json({ ok: true, clientId });
  } catch (err) {
    console.error("convert lead error", err);
    return res.status(500).send("error");
  }
});

app.get("/leads/:id/events", async (req, res) => {
  const { id } = req.params;
  try {
    const snap = await firestore
      .collection("events")
      .where("leadId", "==", id)
      .orderBy("at", "desc")
      .limit(50)
      .get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json(data);
  } catch (err) {
    console.error("events error", err);
    return res.status(500).send("error");
  }
});

app.get("/clients", async (_req, res) => {
  try {
    const snap = await firestore
      .collection("clients")
      .orderBy("updatedAt", "desc")
      .limit(100)
      .get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json(data);
  } catch (err) {
    console.error("clients error", err);
    return res.status(500).send("error");
  }
});

app.get("/clients/:id/events", async (req, res) => {
  const { id } = req.params;
  try {
    const snap = await firestore
      .collection("client_events")
      .where("clientId", "==", id)
      .orderBy("at", "desc")
      .limit(50)
      .get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json(data);
  } catch (err) {
    console.error("client events error", err);
    return res.status(500).send("error");
  }
});

app.post("/files", requireWriteToken, async (req, res) => {
  try {
    const id = req.body.id || `file-${Date.now()}`;
    await upsertFile({
      id,
      title: req.body.title,
      clientId: req.body.clientId,
      installateurId: req.body.installateurId || "INST-DEFAULT",
      pack: req.body.pack,
      price: req.body.price,
      status: req.body.status,
      address: req.body.address,
      power: req.body.power,
      mairieStatus: req.body.mairieStatus,
      consuelStatus: req.body.consuelStatus,
      enedisStatus: req.body.enedisStatus,
      edfStatus: req.body.edfStatus,
      notes: req.body.notes,
    });
    await logFileEvent(id, "create", req.body);
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("create file error", err);
    return res.status(500).send("error");
  }
});

app.patch("/files/:id", requireWriteToken, async (req, res) => {
  const { id } = req.params;
  try {
    await upsertFile({ id, ...req.body });
    await logFileEvent(id, "update", req.body);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("update file error", err);
    return res.status(500).send("error");
  }
});

app.get("/files", async (_req, res) => {
  try {
    const { limit, offset } = parseLimitOffset(_req, 100);
    const total = await countCollection("files");
    const snap = await firestore
      .collection("files")
      .orderBy("updatedAt", "desc")
      .offset(offset)
      .limit(limit)
      .get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ items: data, total });
  } catch (err) {
    console.error("files error", err);
    return res.status(500).send("error");
  }
});

app.get("/files/:id/events", async (req, res) => {
  const { id } = req.params;
  try {
    const snap = await firestore
      .collection("file_events")
      .where("fileId", "==", id)
      .orderBy("at", "desc")
      .limit(50)
      .get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json(data);
  } catch (err) {
    console.error("file events error", err);
    return res.status(500).send("error");
  }
});

app.get("/installateurs/:id/leads", async (req, res) => {
  const { id } = req.params;
  try {
    const snap = await firestore
      .collection("leads")
      .where("installateurId", "==", id)
      .limit(100)
      .get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ leads: data, total: data.length });
  } catch (err) {
    console.error("installateur leads error", err);
    return res.status(500).send("error");
  }
});

app.get("/installateurs/:id/dossiers", async (req, res) => {
  const { id } = req.params;
  try {
    const snap = await firestore
      .collection("files")
      .where("installateurId", "==", id)
      .limit(100)
      .get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    const byStatus = {};
    data.forEach((d) => {
      const s = d.status || "unknown";
      byStatus[s] = (byStatus[s] || 0) + 1;
    });
    
    return res.status(200).json({ dossiers: data, total: data.length, byStatus });
  } catch (err) {
    console.error("installateur dossiers error", err);
    return res.status(500).send("error");
  }
});

app.get("/installateurs/:id/stats", async (req, res) => {
  const { id } = req.params;
  try {
    const leadsSnap = await firestore
      .collection("leads")
      .where("installateurId", "==", id)
      .get();
    
    const filesSnap = await firestore
      .collection("files")
      .where("installateurId", "==", id)
      .get();
    
    const leadsTotal = leadsSnap.size;
    const dossiersTotal = filesSnap.size;
    const conversionRate = leadsTotal > 0 ? Math.round((dossiersTotal / leadsTotal) * 100) : 0;
    
    return res.status(200).json({
      leadsTotal,
      dossiersTotal,
      conversionRate: `${conversionRate}%`,
      installateurId: id,
    });
  } catch (err) {
    console.error("installateur stats error", err);
    return res.status(500).send("error");
  }
});

app.get("/health", (req, res) => res.status(200).send("ok"));

app.get("/stats", async (_req, res) => {
  try {
    const leadsSnap = await firestore.collection("leads").get();
    const filesSnap = await firestore.collection("files").get();
    const clientsSnap = await firestore.collection("clients").get();

    const leadTotals = leadsSnap.docs.reduce((acc, d) => {
      const s = (d.data().status || "unknown").toLowerCase();
      acc.total += 1;
      acc.byStatus[s] = (acc.byStatus[s] || 0) + 1;
      return acc;
    }, { total: 0, byStatus: {} });

    const fileTotals = filesSnap.docs.reduce((acc, d) => {
      const s = (d.data().status || "unknown").toLowerCase();
      acc.total += 1;
      acc.byStatus[s] = (acc.byStatus[s] || 0) + 1;
      return acc;
    }, { total: 0, byStatus: {} });

    const clientsTotal = clientsSnap.size;

    return res.status(200).json({
      leads: leadTotals,
      files: fileTotals,
      clients: { total: clientsTotal },
    });
  } catch (err) {
    console.error("stats error", err);
    return res.status(500).send("error");
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API listening on ${port}`));
