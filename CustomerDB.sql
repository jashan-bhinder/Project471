CREATE TABLE CUSTOMER (
                          CUSTOMER_ID CHAR(9) NOT NULL,
                          USERNAME VARCHAR(35) NOT NULL,
                          PASSWORD VARCHAR(99) NOT NULL,
                          ADDRESS VARCHAR(100) NOT NULL,
                          PHONE_NUMBER INT(10) NOT NULL,
                          NAME VARCHAR(30) NOT NULL,
                          PRIMARY KEY (CUSTOMER_ID),
                          UNIQUE (USERNAME)
);
