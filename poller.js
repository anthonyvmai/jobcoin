const mysql = require('mysql')
const request = require('request')
const _ = require('lodash')
const Producer = require('sqs-producer')

const conn = mysql.createConnection({
	host: 'jobcoin-mysql.c7gn5ltapjua.us-east-1.rds.amazonaws.com',
	user: 'foouser',
	password: 'foobar123',
	database: 'jobcoin'
})

const producer = Producer.create({
	queueUrl: 'https://sqs.us-east-1.amazonaws.com/976193603611/jobcoin-deposit',
	region: 'us-east-1',
	accessKeyId: 'AKIAI7UXIXCCNPCUJM3A',
	secretAccessKey: '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'
});

setInterval(poll, 1000)

function poll() {
	const sql = 'SELECT * FROM mix_address where received = 0'
	conn.query(sql, function(err, rows) {
		if (err) throw err
		const inAddresses = _.map(rows, function(r) {return r.inAddress})

		if (inAddresses.length > 0) {
			request('http://jobcoin.gemini.com/wrongness/api/transactions', function (err, res) {
				const newTransactions = _.filter(JSON.parse(res.body), function (t) {
					return _.includes(inAddresses, t.toAddress)
				})

				_.forEach(newTransactions, function(t) {
					const msg = {id:'id',body:JSON.stringify(t)}
					console.log(t.toAddress)
					producer.send(msg, function(err) {
						if (err) throw err
						const newSql = `UPDATE mix_address SET received = 1 WHERE inAddress = "${t.toAddress}"`
						conn.query(newSql, function(err) {
							if (err) throw err
						})
					})
				})
			})
		}
	})
}
