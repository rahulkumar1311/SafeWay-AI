import mongoose from 'mongoose';

const trafficRuleSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      trim: true
    },
    fineAmount: {
      type: Number,
      required: [true, 'Fine amount is required'],
      min: [0, 'Fine amount must not be negative']
    },
    sourceUrl: {
      type: String,
      required: [true, 'Source URL is required'],
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return false;
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: (props) => `${props.value} is not a valid URL`
      }
    },
    lastUpdated: {
      type: Date,
      required: [true, 'Last updated date is required'],
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Useful compound index for querying traffic rules by state and category
trafficRuleSchema.index({ state: 1, category: 1 });

const TrafficRule =
  mongoose.models.TrafficRule || mongoose.model('TrafficRule', trafficRuleSchema);

export default TrafficRule;
