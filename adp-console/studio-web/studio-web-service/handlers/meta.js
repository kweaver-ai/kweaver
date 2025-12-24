export const meta = async function (req, res) {
    try {
        var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
        var localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 19) + '+08:00';
        res.set('x-tclient-addr', req.headers['x-real-ip']);
        res.set('x-server-time', localISOTime);
        res.status(200);
    } catch (err) {
        res.status(500);
    } finally {
        res.set('Content-Type', 'application/json');
        res.end();
    }
}