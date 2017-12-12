use jobcoin;

CREATE TABLE mix_address (
    inAddress VARCHAR(100) NOT NULL PRIMARY KEY,
    outAddresses VARCHAR(1000) NOT NULL, -- comma separated
    received TINYINT(1) NOT NULL DEFAULT '0'
);
