import { Claim, User } from "./models.js";
import { sampleData } from "./data.js";
// Both adapters use the same API contract. Demo writes exist only until restart.
export async function createStore(demo = false) {
  const conflict = () =>
    Object.assign(new Error("This claim changed. Refresh and try again."), {
      status: 409,
    });
  if (!demo)
    return {
      users: {
        find: (email) => User.findOne({ email }).lean(),
        get: (id) => User.findById(id).lean(),
        list: () => User.find().select("-passwordHash").lean(),
        create: (data) => User.create(data),
      },
      claims: {
        list: () => Claim.find().sort({ createdAt: -1 }).lean(),
        get: (id) => Claim.findById(id).lean(),
        create: (data) => Claim.create(data),
        save: async (data) => {
          const version = data.__v || 0;
          const result = await Claim.findOneAndReplace(
            { _id: data._id, __v: version },
            { ...data, __v: version + 1 },
            { new: true, runValidators: true },
          );
          if (!result) throw conflict();
          return result;
        },
        delete: (id) => Claim.findByIdAndDelete(id),
      },
    };
  const data = await sampleData();
  const clone = (v) => (v ? structuredClone(v) : null);
  return {
    users: {
      find: async (email) => clone(data.users.find((u) => u.email === email)),
      get: async (id) => clone(data.users.find((u) => u._id === id)),
      list: async () => data.users.map(({ passwordHash, ...u }) => clone(u)),
      create: async (u) => {
        if (data.users.some((x) => x.email === u.email))
          throw Object.assign(new Error("This email is already registered"), {
            status: 409,
          });
        data.users.push(clone(u));
        return clone(u);
      },
    },
    claims: {
      list: async () =>
        clone(data.claims).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        ),
      get: async (id) => clone(data.claims.find((c) => c._id === id)),
      create: async (c) => {
        const record = { ...c, __v: 0 };
        data.claims.push(clone(record));
        return clone(record);
      },
      save: async (c) => {
        const i = data.claims.findIndex((x) => x._id === c._id);
        if (i < 0 || (data.claims[i].__v || 0) !== (c.__v || 0))
          throw conflict();
        const record = { ...c, __v: (c.__v || 0) + 1 };
        data.claims[i] = clone(record);
        return clone(record);
      },
      delete: async (id) => {
        const i = data.claims.findIndex((c) => c._id === id);
        return i < 0 ? null : data.claims.splice(i, 1)[0];
      },
    },
  };
}
