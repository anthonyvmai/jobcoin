const express = require('express');
const router = express.Router();

const crypto = require('crypto')
const mysql = require('mysql')

const pool = mysql.createPool({
	host: 'jobcoin-mysql.c7gn5ltapjua.us-east-1.rds.amazonaws.com',
	user: 'foouser',
	password: 'foobar123',
	database: 'jobcoin'
})

router.post('/', function(req, res) {
	pool.getConnection(function(err, conn) {
		if (err) {
			conn.release()
			res.status(500).json({'err_msg': 'Database error'})
			return
		}
		const newAddress = crypto.randomBytes(32).toString('hex')
		const userAddresses = req.body.addresses.join(',')
		// beware sql injection
		const sql = `INSERT INTO mix_address VALUES ("${newAddress}", "${userAddresses}", 0)`

		conn.query(sql, function(err, rows) {
			conn.release()
			if (err) {
				res.status(500).json({'err_msg': 'Database error'})
				return
			}
			res.json({'address': newAddress})
		})
	})
});

module.exports = router;
