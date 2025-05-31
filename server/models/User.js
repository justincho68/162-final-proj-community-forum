const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    //use firebase as the identifier
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    //basic user info coming in from firebase
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    displayName: {
        type: String,
        trim: true
    },

    photoURL: {
        type: String
    },

    profile: {
        firstName: {
            type: String,
            trim: true
        },
        lastName: {
            type: String,
            trim: true
        },
        bio: {
            type: String,
            maxLength: 500
        },
        
        dateOfBirth: {
            type: Date
        },

        location: {
            city: String,
            country: String
        },
        
        preferences: {
            theme: {
                type: String,
                enum: ['light', 'dark'],
                default: 'light'
            },
            notifications: {
                email: {type: Boolean, default: true},
                push: {type: Boolean, default: true}
            }
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },

    role: {
        type: String,
        enum: ['user', 'admin', 'mdoerator'],
        default: 'user'
    },
 
    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    },

    lastLoginDate: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

//user indexing
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1});

//pre save the middleware so that it can update the updatedAt portion
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
})

//Instance methods
userSchema.methods.getFullName = function() {
    if (this.profile.firstName && this.profile.lastName) {
        return `${this.profile.firstName} ${this.profile.lastName}`;
    }
    return this.displayName || this.email;
};

userSchema.methods.updateLastLogin = function() {
    this.lastLoginAt = new Date();
    return this.save();
};

userSchema.statics.findByFirebaseUid = function () {
    return this.findOne({ firebaseUid });
},

userSchema.statics.createFromFirebaseUser = function(firebaseUser, additionalDate = {}) {
    return this.create({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        ...additionalData
    });
};

module.exports = mongoos.model('User', userSchema);