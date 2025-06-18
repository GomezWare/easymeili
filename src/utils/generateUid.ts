 export const generateUid = () => {
    const random = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString(36);
    return `${timestamp}${random}`;
}