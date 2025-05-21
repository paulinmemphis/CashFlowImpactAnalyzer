export default async function submitApproval(payload) {
  try {
    const resp = await fetch(process.env.REACT_APP_APPROVE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return resp.ok;
  } catch {
    return false;
  }
}
