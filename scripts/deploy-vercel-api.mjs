import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const token = process.env.VERCEL_TOKEN;
const teamId = process.env.VERCEL_TEAM_ID;
const projectName = process.env.VERCEL_PROJECT_NAME || "learnedcircle";
const root = process.env.DEPLOY_ROOT || join(process.cwd(), "outputs");

if (!token || !teamId) {
  throw new Error("VERCEL_TOKEN and VERCEL_TEAM_ID are required.");
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    if (entry.isFile()) return [fullPath];
    return [];
  }));

  return files.flat();
}

async function uploadFile(filePath) {
  const bytes = await readFile(filePath);
  const sha = createHash("sha1").update(bytes).digest("hex");
  const uploadUrl = `https://api.vercel.com/v2/files?teamId=${encodeURIComponent(teamId)}`;
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "x-vercel-digest": sha
    },
    body: bytes
  });

  if (!uploadResponse.ok && uploadResponse.status !== 409) {
    const errorText = await uploadResponse.text();
    throw new Error(`Upload failed for ${filePath}: ${uploadResponse.status} ${errorText}`);
  }

  return {
    file: relative(root, filePath).replaceAll("\\", "/"),
    sha
  };
}

async function createDeployment(files) {
  const deployUrl = `https://api.vercel.com/v13/deployments?teamId=${encodeURIComponent(teamId)}`;
  const deployResponse = await fetch(deployUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: projectName,
      files,
      target: "production",
      projectSettings: {
        framework: null,
        buildCommand: null,
        outputDirectory: ".",
        installCommand: null
      }
    })
  });

  const deployment = await deployResponse.json();

  if (!deployResponse.ok) {
    throw new Error(`Deployment failed: ${deployResponse.status} ${JSON.stringify(deployment)}`);
  }

  return deployment;
}

async function waitForDeployment(id) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const statusResponse = await fetch(`https://api.vercel.com/v13/deployments/${id}?teamId=${encodeURIComponent(teamId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const status = await statusResponse.json();

    if (!statusResponse.ok) {
      throw new Error(`Could not check deployment: ${statusResponse.status} ${JSON.stringify(status)}`);
    }

    if (status.readyState === "READY" || status.readyState === "ERROR" || status.readyState === "CANCELED") {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Deployment timed out before Vercel reported READY.");
}

const diskFiles = await listFiles(root);
const files = [];

for (const filePath of diskFiles) {
  files.push(await uploadFile(filePath));
}

const deployment = await createDeployment(files);
const finalStatus = await waitForDeployment(deployment.id);

console.log(JSON.stringify({
  id: deployment.id,
  url: deployment.url,
  readyState: finalStatus.readyState,
  aliases: finalStatus.alias || [],
  fileCount: files.length
}, null, 2));
