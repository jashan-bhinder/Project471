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
                          EMPLOYEE_ID    CHAR(9)        NOT NULL,
                          FNAME          VARCHAR(15)    NOT NULL,
                          LNAME          VARCHAR(15),
                          PHONE_NUMBER   INT(10)        NOT NULL,
                          START_DATE     DATE           NOT NULL,
                          USERNAME       VARCHAR(35)    NOT NULL,
                          PASSWORD       VARCHAR(99)    NOT NULL,
                          EMAIL          VARCHAR(50)    NOT NULL,
                          IS_OWNER       BOOLEAN        NOT NULL DEFAULT FALSE,
                          IS_WORKER      BOOLEAN        NOT NULL DEFAULT TRUE,
                          PRIMARY KEY (EMPLOYEE_ID),
                          UNIQUE (USERNAME),
                          UNIQUE (EMAIL),
                          CONSTRAINT CHECK_ROLE CHECK (IS_OWNER != IS_WORKER)
);

CREATE TABLE OWNER (
                       EMPLOYEE_ID CHAR(9) NOT NULL,
                       PRIMARY KEY (EMPLOYEE_ID),
                       FOREIGN KEY (EMPLOYEE_ID) REFERENCES EMPLOYEE (EMPLOYEE_ID)
                           ON DELETE CASCADE
                           ON UPDATE CASCADE
);


CREATE TABLE ESTIMATE (
                          ESTIMATE_NUM INT NOT NULL,
                          ADDRESS VARCHAR(100) NOT NULL,
                          PROJECT_COST INT NULL,
                          ESTIMATE_PDF BLOB NULL,
                          GST INT NULL CHECK (GST IS NULL OR PROJECT_COST * 0.05 = GST),
                          TOTAL INT NULL CHECK (TOTAL IS NULL OR PROJECT_COST + GST = TOTAL),
                          PENDING_STATUS BOOLEAN NOT NULL DEFAULT TRUE,
                          REQUEST_DATE DATE NOT NULL,
                          CREATION_DATE DATE NULL,
                          EMPLOYEE_ID CHAR(9) NOT NULL DEFAULT 'E00000001',
                          CUSTOMER_ID CHAR(9) NOT NULL DEFAULT '999999999',
                          PRIMARY KEY (ESTIMATE_NUM),
                          FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER (CUSTOMER_ID)
                              ON DELETE RESTRICT ON UPDATE CASCADE,
                          FOREIGN KEY (EMPLOYEE_ID) REFERENCES EMPLOYEE (EMPLOYEE_ID)
                              ON DELETE RESTRICT ON UPDATE CASCADE
);


CREATE TABLE CONTRACT (
                          CONTRACT_NUM VARCHAR(15) NOT NULL,
                          CONTRACT_PDF VARCHAR(1000) NULL,  -- Changed from BLOB to VARCHAR(1000)
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

CREATE TABLE COMPLETION_CERTIFICATE (
                                        CERTIFICATE_NUM INT NOT NULL,
                                        CERTIFICATE_PDF VARCHAR(1000) NULL,  -- Changed from BLOB to VARCHAR(1000)
                                        DATE DATE NOT NULL,
                                        CUSTOMER_ID CHAR(9) NOT NULL DEFAULT '999999999',
                                        PROJECT_NUM INT NULL,
                                        PRIMARY KEY (CERTIFICATE_NUM),
                                        FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER (CUSTOMER_ID)
                                            ON DELETE SET DEFAULT
                                            ON UPDATE CASCADE,
                                        FOREIGN KEY (PROJECT_NUM) REFERENCES PROJECT (PROJECT_NUM)
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
                                   EMPLOYEE_ID CHAR(9) NOT NULL DEFAULT('E00000001'),
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

CREATE TABLE ORDERS (
                         ORDER_NUM        INT         NOT NULL,
                         STORE_NAME       VARCHAR(50) NOT NULL,
                         COMPLETION_STAT  BOOLEAN     NOT NULL DEFAULT FALSE,
                         PROJECT_NUM      INT         NOT NULL DEFAULT 999999999,
                         PRIMARY KEY (ORDER_NUM),
                         FOREIGN KEY (PROJECT_NUM) REFERENCES PROJECT (PROJECT_NUM)
                             ON DELETE SET DEFAULT
                             ON UPDATE CASCADE
);

CREATE TABLE MATERIALS (
                           MATERIAL_ID      CHAR(15)    NOT NULL,
                           NAME             VARCHAR(50) NOT NULL,
                           TYPE             VARCHAR(30) NOT NULL,
                           COST             INT         NOT NULL,
                           AMOUNT           INT         NOT NULL,
                           ORDER_NUM        INT         NOT NULL,
                           PRIMARY KEY (MATERIAL_ID),
                           FOREIGN KEY (ORDER_NUM) REFERENCES ORDERS (ORDER_NUM)
                               ON DELETE CASCADE
                               ON UPDATE CASCADE
);

CREATE TABLE INCLUDES (
                          PROJECT_NUM      INT         NOT NULL,
                          ESTIMATE_NUM     INT         NOT NULL,
                          MATERIAL_ID      CHAR(15)    NOT NULL,
                          PRIMARY KEY (PROJECT_NUM, ESTIMATE_NUM, MATERIAL_ID),
                          FOREIGN KEY (PROJECT_NUM) REFERENCES PROJECT (PROJECT_NUM)
                              ON DELETE CASCADE
                              ON UPDATE CASCADE,
                          FOREIGN KEY (ESTIMATE_NUM) REFERENCES ESTIMATE (ESTIMATE_NUM)
                              ON DELETE CASCADE
                              ON UPDATE CASCADE,
                          FOREIGN KEY (MATERIAL_ID) REFERENCES MATERIALS (MATERIAL_ID)
                              ON DELETE CASCADE
                              ON UPDATE CASCADE
);

