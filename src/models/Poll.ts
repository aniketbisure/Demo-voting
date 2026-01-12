import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICandidate {
    seat: string;
    name: string;
    serialNumber: string;
    symbolUrl: string;
    partySymbolUrl: string;
    bgColor?: string;
    votes?: number;
}

export interface IPoll extends Document {
    id: string; // Custom ID used in URLs
    title: string;
    subTitle: string;
    partyName: string;
    mainSymbolUrl: string;
    ogImage: string;
    votingDate?: string;
    blueInfoText?: string;
    yellowTitleText?: string;
    yellowFooterText?: string;
    showCandidateImages: boolean;
    contactNumber?: string;
    candidates: ICandidate[];
    createdAt: Date;
}

const CandidateSchema = new Schema<ICandidate>({
    seat: { type: String, required: true },
    name: { type: String, required: true },
    serialNumber: { type: String, required: true },
    symbolUrl: { type: String, required: true },
    partySymbolUrl: { type: String, required: true },
    bgColor: { type: String, default: '#fff' },
    votes: { type: Number, default: 0 }
});

const PollSchema = new Schema<IPoll>({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    subTitle: { type: String, required: true },
    partyName: { type: String, required: true },
    mainSymbolUrl: { type: String, required: true },
    ogImage: { type: String },
    votingDate: { type: String },
    blueInfoText: { type: String },
    yellowTitleText: { type: String },
    yellowFooterText: { type: String },
    showCandidateImages: { type: Boolean, default: true },
    contactNumber: { type: String },
    candidates: [CandidateSchema],
    createdAt: { type: Date, default: Date.now }
});

// Create model, preventing overwrite error in dev hot reload
const Poll: Model<IPoll> = mongoose.models.Poll || mongoose.model<IPoll>('Poll', PollSchema);

export default Poll;
