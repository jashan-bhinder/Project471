CREATE TABLE CUSTOMER (
                          CUSTOMER_ID CHAR(9) NOT NULL,
                          USERNAME VARCHAR(35) NOT NULL,
                          PASSWORD VARCHAR(99) NOT NULL,
                          ADDRESS VARCHAR(100) NOT NULL,
                          PHONE_NUMBER INT(10) NOT NULL,
                          NAME VARCHAR(30) NOT NULL,
                          EMAIL VARCHAR(50) NOT NULL,
                          PRIMARY KEY (CUSTOMER_ID),
                          UNIQUE (USERNAME),
                          UNIQUE (EMAIL)
);

CREATE TABLE EMPLOYEE (
                          EMPLOYEE_ID CHAR(9) NOT NULL,
                          FNAME VARCHAR(15) NOT NULL,
                          LNAME VARCHAR(15),
                          PHONE_NUMBER INT(10) NOT NULL,
                          START_DATE DATE NOT NULL,
                          USERNAME VARCHAR(35) NOT NULL,
                          PASSWORD VARCHAR(99) NOT NULL,
                          EMAIL VARCHAR(50) NOT NULL,
                          PRIMARY KEY (EMPLOYEE_ID),
                          UNIQUE (USERNAME),
                          UNIQUE (EMAIL)
);

CREATE TABLE OWNER (
                       EMPLOYEE_ID CHAR(9) NOT NULL,
                       PRIMARY KEY (EMPLOYEE_ID),
                       FOREIGN KEY (EMPLOYEE_ID) REFERENCES EMPLOYEE (EMPLOYEE_ID)
                           ON DELETE CASCADE
                           ON UPDATE CASCADE
);

CREATE TABLE ESTIMATE (
                          ESTIMATE_NUM INT NOT NULL,  -- Unique estimate number
                          ADDRESS VARCHAR(100) NOT NULL,  -- Address provided by the customer
                          PROJECT_COST INT NULL,  -- Initially NULL, set when the estimate is accepted
                          ESTIMATE_PDF BLOB NULL,  -- Initially NULL, set when the estimate is accepted
                          GST INT NULL,  -- Initially NULL, calculated when the estimate is accepted
                          TOTAL INT NULL,  -- Initially NULL, calculated when the estimate is accepted
                          PENDING_STATUS BOOLEAN NOT NULL DEFAULT TRUE,  -- Default status is pending
                          REQUEST_DATE DATE NOT NULL,  -- Automatically set to the current date
                          CREATION_DATE DATE NULL,  -- Initially NULL, set when the estimate is accepted
                          EMPLOYEE_ID CHAR(9) NOT NULL DEFAULT 'E00000001',  -- Default owner ID
                          CUSTOMER_ID CHAR(9) NOT NULL DEFAULT '999999999',  -- Default customer ID
                          PRIMARY KEY (ESTIMATE_NUM),
                          CONSTRAINT CHK_GST CHECK (GST IS NULL OR PROJECT_COST * 0.05 = GST),  -- Ensure GST is valid if not NULL
                          CONSTRAINT CHK_TOTAL CHECK (TOTAL IS NULL OR PROJECT_COST + GST = TOTAL),  -- Ensure TOTAL is valid if not NULL
                          FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER (CUSTOMER_ID)
                              ON DELETE SET DEFAULT
                              ON UPDATE CASCADE,
                          FOREIGN KEY (EMPLOYEE_ID) REFERENCES OWNER (EMPLOYEE_ID)
                              ON DELETE SET DEFAULT
                              ON UPDATE CASCADE
);

CREATE TABLE COMPLETION_CERTIFICATE (
                                        CERTIFICATE_NUM INT NOT NULL,
                                        CERTIFICATE_PDF BLOB NULL,
                                        DATE DATE NOT NULL,
                                        CUSTOMER_ID CHAR(9) NOT NULL DEFAULT '999999999',
                                        PRIMARY KEY (CERTIFICATE_NUM),
                                        FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER (CUSTOMER_ID)
                                            ON DELETE SET DEFAULT
                                            ON UPDATE CASCADE
);

CREATE TABLE CONTRACT (
                          CONTRACT_NUM VARCHAR(15) NOT NULL,
                          CONTRACT_PDF BLOB NULL,
                          EMPLOYEE_ID CHAR(9) NOT NULL DEFAULT '999999999',
                          CUSTOMER_ID CHAR(9) NOT NULL DEFAULT '999999999',
                          PRIMARY KEY (CONTRACT_NUM),
                          FOREIGN KEY (EMPLOYEE_ID) REFERENCES OWNER (EMPLOYEE_ID)
                              ON DELETE SET DEFAULT
                              ON UPDATE CASCADE,
                          FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER (CUSTOMER_ID)
                              ON DELETE SET DEFAULT
                              ON UPDATE CASCADE
);

CREATE TABLE PROJECT (
                         PROJECT_NUM INT NOT NULL,
                         ESTIMATE_LENGTH TIME,
                         START_TIME DATE,
                         ADDRESS VARCHAR(100) NOT NULL,
                         EMPLOYEE_ID CHAR(9) NOT NULL DEFAULT '999999999',
                         PRIMARY KEY (PROJECT_NUM),
                         FOREIGN KEY (EMPLOYEE_ID) REFERENCES OWNER (EMPLOYEE_ID)
                             ON DELETE SET DEFAULT
                             ON UPDATE CASCADE
);

CREATE TABLE SIGNS_CONTRACT (
                                EMPLOYEE_ID CHAR(9) NOT NULL,
                                CUSTOMER_ID CHAR(9) NOT NULL,
                                CONTRACT_NUM VARCHAR(15) NOT NULL,
                                PROJECT_NUM INT NOT NULL,
                                DATE DATE NOT NULL,
                                PRIMARY KEY (EMPLOYEE_ID, CUSTOMER_ID, CONTRACT_NUM),
                                FOREIGN KEY (EMPLOYEE_ID) REFERENCES OWNER (EMPLOYEE_ID)
                                    ON DELETE CASCADE
                                    ON UPDATE CASCADE,
                                FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER (CUSTOMER_ID)
                                    ON DELETE CASCADE
                                    ON UPDATE CASCADE,
                                FOREIGN KEY (CONTRACT_NUM) REFERENCES CONTRACT (CONTRACT_NUM)
                                    ON DELETE CASCADE
                                    ON UPDATE CASCADE,
                                FOREIGN KEY (PROJECT_NUM) REFERENCES PROJECT (PROJECT_NUM)
                                    ON DELETE CASCADE
                                    ON UPDATE CASCADE
);


CREATE TABLE SIGNS_CERTIFICATE (
                                   CERTIFICATE_NUM INT NOT NULL,
                                   EMPLOYEE_ID CHAR(9) NOT NULL,
                                   CUSTOMER_ID CHAR(9) NOT NULL,
                                   PROJECT_NUM INT NOT NULL,
                                   PRIMARY KEY (EMPLOYEE_ID, CUSTOMER_ID, CERTIFICATE_NUM),
                                   FOREIGN KEY (EMPLOYEE_ID) REFERENCES OWNER (EMPLOYEE_ID)
                                       ON DELETE CASCADE
                                       ON UPDATE CASCADE,
                                   FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER (CUSTOMER_ID)
                                       ON DELETE CASCADE
                                       ON UPDATE CASCADE,
                                   FOREIGN KEY (CERTIFICATE_NUM) REFERENCES COMPLETION_CERTIFICATE (CERTIFICATE_NUM)
                                       ON DELETE CASCADE
                                       ON UPDATE CASCADE,
                                   FOREIGN KEY (PROJECT_NUM) REFERENCES PROJECT (PROJECT_NUM)
                                       ON DELETE CASCADE
                                       ON UPDATE CASCADE
);

