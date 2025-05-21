export async function fetchLatestExcel(folderUrl) {
  const token = process.env.REACT_APP_GRAPH_TOKEN;
  // Encode the share URL for Graph
  const api = `https://graph.microsoft.com/v1.0/shares/u!${btoa(folderUrl).replace(/=+$/, '')}/driveItem/children?$orderby=lastModifiedDateTime desc`;
  const resp = await fetch(api, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const files = await resp.json();
  const excel = files.value.find(f => f.name.endsWith('.xlsx'));
  return excel ? excel['@microsoft.graph.downloadUrl'] : null;
}
