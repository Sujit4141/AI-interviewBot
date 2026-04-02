const { BufferJSON, initAuthCreds } = require("@whiskeysockets/baileys");
const mongoose = require("mongoose");

const authSchema = new mongoose.Schema({
  _id: String,
  data: Object,
});

const AuthModel = mongoose.models.AuthState || mongoose.model("AuthState", authSchema);

const useMongoAuthState = async () => {
  const writeData = async (data, id) => {
    await AuthModel.findByIdAndUpdate(
      id,
      { data: JSON.parse(JSON.stringify(data, BufferJSON.replacer)) },
      { upsert: true }
    );
  };

  const readData = async (id) => {
    const item = await AuthModel.findById(id);
    if (!item) return null;
    return JSON.parse(JSON.stringify(item.data), BufferJSON.reviver);
  };

  const removeData = async (id) => {
    await AuthModel.findByIdAndDelete(id);
  };

  const creds = (await readData("creds")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          for (const id of ids) {
            const val = await readData(`${type}-${id}`);
            if (val) data[id] = val;
          }
          return data;
        },
        set: async (data) => {
          for (const [type, ids] of Object.entries(data)) {
            for (const [id, val] of Object.entries(ids)) {
              if (val) await writeData(val, `${type}-${id}`);
              else await removeData(`${type}-${id}`);
            }
          }
        },
      },
    },
    saveCreds: async () => {
      await writeData(creds, "creds");
    },
  };
};

module.exports = { useMongoAuthState };