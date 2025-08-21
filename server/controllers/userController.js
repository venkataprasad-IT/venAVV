import sql from "../configs/db.js";

// Get creations for a specific user
export const getUserCreations = async (req, res) => {
    try {
        const authData = typeof req.auth === 'function' ? await req.auth() : (req.auth || {});
        const userId = authData?.userId;
        const creations = await sql`
            SELECT * FROM creations 
            WHERE user_id = ${userId} 
            ORDER BY created_at DESC
        `;
        res.json({ success: true, creations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all published creations
export const getPublishedCreations = async (req, res) => {
    try {
        const creations = await sql`
            SELECT * FROM creations 
            WHERE publish = true 
            ORDER BY created_at DESC
        `;
        res.json({ success: true, creations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Like or unlike a creation
export const toggleLikeCreation = async (req, res) => {
    try {
        const authData = typeof req.auth === 'function' ? await req.auth() : (req.auth || {});
        const userId = authData?.userId;
        const { id } = req.body;

        // Fetch creation
        const [creation] = await sql`
            SELECT * FROM creations WHERE id = ${id}
        `;

        if (!creation) {
            return res.status(404).json({ success: false, message: "Creation not found" });
        }

        // Ensure likes is always an array
        const currentLikes = Array.isArray(creation.likes) ? creation.likes : [];
        const userIdStr = String(userId);

        let updatedLikes;
        let message;

        if (currentLikes.includes(userIdStr)) {
            updatedLikes = currentLikes.filter(user => user !== userIdStr);
            message = "Creation unliked";
        } else {
            updatedLikes = [...currentLikes, userIdStr];
            message = "Creation liked";
        }

        // Update likes in DB (Postgres text array format)
        await sql`
            UPDATE creations 
            SET likes = ${sql.array(updatedLikes, 'text')}
            WHERE id = ${id}
        `;

        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
