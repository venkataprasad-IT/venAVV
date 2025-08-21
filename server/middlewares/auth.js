import { clerkClient } from "@clerk/clerk-sdk-node";

// Middleware to check userId and hasPremiumPlan
export const auth = async (req, res, next) => {
    try {
        const authData = typeof req.auth === 'function' ? await req.auth() : (req.auth || {});
        const userId = authData?.userId;
        const has = authData?.has;
        let hasPremiumPlan = false;
        if (typeof has === 'function') {
            try { hasPremiumPlan = await has({ plan: 'premium' }); } catch {}
        }
        let user;
        if (userId) {
            try { user = await clerkClient.users.getUser(userId); } catch {}
        }
        if (!hasPremiumPlan && user?.privateMetadata?.free_usage) {
            req.free_usage = user.privateMetadata.free_usage;
        } else {
            if (userId) {
                try {
                    await clerkClient.users.updateUserMetadata(userId, {
                        privateMetadata: { free_usage: 0 }
                    });
                } catch {}
            }
            req.free_usage = 0;
        }
        req.plan = hasPremiumPlan ? 'premium' : 'free';
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        // Be tolerant in case of auth issues; default to free plan
        req.plan = 'free';
        req.free_usage = 0;
        next();
    }
};