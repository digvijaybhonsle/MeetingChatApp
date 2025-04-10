"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const RoomSchema = new mongoose_1.default.Schema({
    hostId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    videoUrl: { type: String, required: true },
    users: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now }
});
exports.Room = mongoose_1.default.model("Room", RoomSchema);
