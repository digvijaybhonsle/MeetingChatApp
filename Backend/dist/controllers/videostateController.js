var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import VideoState from "../models/videoState";
export const updateVideoState = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { state, timestamp } = req.body;
        const videoState = new VideoState({ roomId: req.params.id, state, timestamp });
        yield videoState.save();
        res.status(201).json(videoState);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to update video state" });
    }
});
