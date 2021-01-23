const statuses = []
function updateStatus (status) {
  status = new Date().toLocaleString() + ": " + status;
  console.debug(status)
  statuses.unshift(status)
  if (statuses.length > 100) statuses.pop()
}

export default {
  updateStatus,
  statuses
}
