function encodeSharingUrl(url) {
  // Standard base64 encoding, then URL-safe replacements
  let encoded = btoa(url)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return encoded;
}

export async function fetchLatestExcel(folderUrl) {
  const token = process.env.REACT_APP_GRAPH_TOKEN;
  if (!token) {
    alert('Graph token missing');
    return null;
  }
  const encoded = encodeSharingUrl(folderUrl);
  const api = `https://graph.microsoft.com/v1.0/shares/u!${encoded}/driveItem/children?$orderby=lastModifiedDateTime desc`;
  try {
    const resp = await fetch(api, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) {
      const errorText = await resp.text();
      alert('Graph API Error: ' + errorText);
      return null;
    }
    const files = await resp.json();
    const excel = files.value?.find(f => f.name.endsWith('.xlsx'));
    return excel ? excel['@microsoft.graph.downloadUrl'] : null;
  } catch (err) {
    alert('Error fetching Excel: ' + err.message);
    return null;
  }
}

