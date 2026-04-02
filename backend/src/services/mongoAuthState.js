const { BufferJSON, initAuthCreds } = require("@whiskeysockets/baileys");
const mongoose = require("mongoose");

const authSchema = new mongoose.Schema({
  _id: String,
  data: Object,
});

const AuthModel =
  mongoose.models.AuthState || mongoose.model("AuthState", authSchema);

const useMongoAuthState = async () => {
  const writeData = async (data, id) => {
    try {
      await AuthModel.findByIdAndUpdate(
        id,
        { data: JSON.parse(JSON.stringify(data, BufferJSON.replacer)) },
        { upsert: true }
      );
    } catch (e) {
      console.error(`❌ Auth write failed for "${id}":`, e.message);
    }
  };

  const readData = async (id) => {
    try {
      const item = await AuthModel.findById(id);
      if (!item) return null;
      return JSON.parse(JSON.stringify(item.data), BufferJSON.reviver);
    } catch (e) {
      console.error(`❌ Auth read failed for "${id}":`, e.message);
      return null;
    }
  };

  const removeData = async (id) => {
    try {
      await AuthModel.findByIdAndDelete(id);
    } catch (e) {
      console.error(`❌ Auth delete failed for "${id}":`, e.message);
    }
  };

  const creds = (await readData("creds")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              const val = await readData(`${type}-${id}`);
              if (val) data[id] = val;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const [type, ids] of Object.entries(data)) {
            for (const [id, val] of Object.entries(ids)) {
              if (val) tasks.push(writeData(val, `${type}-${id}`));
              else tasks.push(removeData(`${type}-${id}`));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      await writeData(creds, "creds");
    },
  };
};

/**
 * Wipes all auth data from MongoDB.
 * Call this before a fresh QR re-pair so stale Signal sessions
 * don't conflict with the new pairing.
 */
const clearMongoAuthState = async () => {
  await AuthModel.deleteMany({});
  console.log("🗑️ All auth state cleared from MongoDB");
};

module.exports = { useMongoAuthState, clearMongoAuthState };