        import { Schema, model } from "mongoose";

        const shiftSchema = new Schema(
            {
                name: {
                    type: String,
                    required: true,
                    unique: true // Ví dụ: "Ca sáng", "Ca chiều", "Ca tối"
                },
                startTime: {
                    type: String, // Format: "HH:mm"
                    required: true
                },
                endTime: {
                    type: String, // Format: "HH:mm"
                    required: true
                },
                description: {
                    type: String
                },
                isActive: {
                    type: Boolean,
                    default: true
                }
            },
            { timestamps: true }
        );

        const Shift = model("Shift", shiftSchema);

        export default Shift;
