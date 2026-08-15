// Tracks live voice channel occupancy.
// channelId -> Set<userId>
const voiceChannelOccupants = new Map();

function addParticipant(channelId, userId) {
  if (!voiceChannelOccupants.has(channelId)) {
    voiceChannelOccupants.set(channelId, new Set());
  }
  voiceChannelOccupants.get(channelId).add(userId);
}

function removeParticipant(channelId, userId) {
  const occupants = voiceChannelOccupants.get(channelId);
  if (occupants) {
    occupants.delete(userId);
    if (occupants.size === 0) {
      voiceChannelOccupants.delete(channelId);
    }
  }
}

function getParticipants(channelId) {
  const occupants = voiceChannelOccupants.get(channelId);
  return occupants ? Array.from(occupants) : [];
}

// LiveKit room names are formatted as "voice-<channelId>" — extract the channel ID back out
function channelIdFromRoomName(roomName) {
  return roomName.startsWith('voice-') ? roomName.slice('voice-'.length) : null;
}

module.exports = {
  addParticipant,
  removeParticipant,
  getParticipants,
  channelIdFromRoomName,
};