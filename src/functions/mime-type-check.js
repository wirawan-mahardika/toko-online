export default function isImage(file) {
    if (
        !(
            file.mimetype == 'image/jpeg' ||
            file.mimetype == 'image/jpg' ||
            file.mimetype == 'image/png'
        )
    ) {
        return false
    }

    return true
}
