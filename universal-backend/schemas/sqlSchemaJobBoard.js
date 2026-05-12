// queries/tenantSchema.js
export default `;

CREATE TABLE IF NOT EXISTS broadcast_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role VARCHAR(255) NULL,
  type ENUM('text', 'image', 'video') NOT NULL,
  text TEXT,
  media_id INT,
  created_by_id VARCHAR(45) NOT NULL,
  created_by_role VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clinics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ClinicId VARCHAR(45) DEFAULT NULL,
  territory_id VARCHAR(45) DEFAULT NULL,
  lab_id VARCHAR(45) DEFAULT NULL,
  clinic_id VARCHAR(256) NOT NULL,
  clinic_name VARCHAR(256) NOT NULL,
  clinic_email VARCHAR(255) NOT NULL,
  clinic_phone VARCHAR(255) NOT NULL,
  clinic_fax VARCHAR(255) NOT NULL,
  clinic_address1 VARCHAR(255) NOT NULL,
  clinic_address2 VARCHAR(255),
  clinic_city VARCHAR(255) NOT NULL,
  clinic_state VARCHAR(255) NOT NULL,
  clinic_zip VARCHAR(255) NOT NULL,
  clinic_manager VARCHAR(255),
  Cmanager_email VARCHAR(255),
  PT_count VARCHAR(255),
  multiple_routes BOOLEAN DEFAULT FALSE,
  lockbox ENUM('combo', 'key', '') DEFAULT 'key',
  combo VARCHAR(100),
  time LONGTEXT,
  opendays JSON,
  draw_week VARCHAR(255),
  draw_days JSON,
  comments LONGTEXT DEFAULT NULL,
  priority BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(45) NOT NULL,
  updated_by VARCHAR(45) DEFAULT NULL,
  created_date DATE,
  updated_date DATE,
  is_deleted TINYINT(1) NULL DEFAULT 0,
  clinic_password VARCHAR(255),
  delivery_id VARCHAR(45),
  ondemand BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  cutoff_time TIME,
  time_zone VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clinic_data (
id INT AUTO_INCREMENT PRIMARY KEY,
clinicid VARCHAR(45) NOT NULL,
photo LONGTEXT DEFAULT NULL,
s_photo LONGTEXT DEFAULT NULL,
location VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS delivery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  DeliveryId VARCHAR(45) DEFAULT NULL,
  territory_id VARCHAR(45) DEFAULT NULL,
  delivery_id VARCHAR(1000) NOT NULL,
  delivery_name VARCHAR(1000) NOT NULL,
  delivery_email VARCHAR(255) DEFAULT NULL,
  delivery_phone VARCHAR(255) DEFAULT NULL,
  delivery_fax VARCHAR(255) DEFAULT NULL,
  delivery_address1 VARCHAR(255) NOT NULL,
  delivery_address2 VARCHAR(255),
  delivery_city VARCHAR(255) DEFAULT NULL,
  delivery_state VARCHAR(255) DEFAULT NULL,
  delivery_zip VARCHAR(255) DEFAULT NULL,
  delivery_manager VARCHAR(255) DEFAULT NULL,
  Cmanager_email VARCHAR(255),
  PT_count VARCHAR(255),
  multiple_routes BOOLEAN DEFAULT FALSE,
  photo LONGTEXT DEFAULT NULL,
  s_photo LONGTEXT DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  time JSON,
  opendays JSON,
  draw_week VARCHAR(255),
  draw_days JSON,
  comments LONGTEXT DEFAULT NULL,
  priority BOOLEAN DEFAULT FALSE,
  lab_id VARCHAR(45) DEFAULT NULL,
  created_by VARCHAR(45) NOT NULL,
  updated_by VARCHAR(45) DEFAULT NULL,
  created_date DATE,
  updated_date DATE,
  is_deleted TINYINT(1) NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


 CREATE TABLE IF NOT EXISTS delivery_person (
  deliveryP_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL,
  delivery_name VARCHAR(255) NOT NULL,
  delivery_email VARCHAR(255) NOT NULL,
  delivery_phone VARCHAR(255) NOT NULL,
  delivery_fax VARCHAR(255),
  wahh VARCHAR(255) NOT NULL,
  arsflight VARCHAR(255) NOT NULL,
  saadelivery VARCHAR(255) NOT NULL,
  bridges_tools VARBINARY(2) NOT NULL,
  comments LONGTEXT DEFAULT NULL,
  assigned_driver VARCHAR(255) NOT NULL,
  territory VARCHAR(255) NOT NULL,
  mileage VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS drivercoordinates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  riderId VARCHAR(255) NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS driver_checkin_report (
  checkin_id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id VARCHAR(45) NOT NULL,
  checkin_date VARCHAR(45) DEFAULT NULL,
  checkin_time VARCHAR(45) DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS driver_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id VARCHAR(45) NOT NULL,
  driver_license VARCHAR(255),
  vehicle_photo VARCHAR(255),
  proof_insurance VARCHAR(255),
  vehicle_registration VARCHAR(255),
  driver_photo VARCHAR(255),
  w9_1099 VARCHAR(255),
  nda_hipaa VARCHAR(255),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS labs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lab_id VARCHAR(45) NOT NULL,
  labcode VARCHAR(255) NULL,
  lab_name VARCHAR(255) NOT NULL,
  lab_contact VARCHAR(255) NOT NULL,
  lab_phone VARCHAR(255) NOT NULL,
  lab_email VARCHAR(255) NOT NULL,
  lab_address VARCHAR(255) NOT NULL,
  lab_city VARCHAR(255) NOT NULL,
  lab_state VARCHAR(255) NOT NULL,
  lab_zip VARCHAR(255) NOT NULL,
  territory_id VARCHAR(45) NULL,
  comments LONGTEXT DEFAULT NULL,
  lab_logo VARCHAR(255) DEFAULT NULL,
  created_by VARCHAR(45) NOT NULL,
  updated_by VARCHAR(45) DEFAULT NULL,
  created_date DATE,
  updated_date DATE,
  is_deleted TINYINT(1) NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lab_state (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  lab_id VARCHAR(45) NOT NULL,
  state_id VARCHAR(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(255) UNIQUE NULL,
  latitude  VARCHAR(255) DEFAULT NULL,
  longitude VARCHAR(255) DEFAULT NULL,
  timestamp DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id VARCHAR(45) NOT NULL,
  sender_role ENUM('admin', 'driver', 'dispatcher') NOT NULL,
  receiver_id VARCHAR(45) NOT NULL,
  receiver_role ENUM('admin', 'driver', 'manager', 'other') NOT NULL,
  type ENUM('text', 'image', 'video') NOT NULL,
  text TEXT,
  media_id INT,
  status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_messages_sender_receiver_status (sender_id, receiver_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS msg (
  msg_id INT AUTO_INCREMENT PRIMARY KEY,
  sender VARCHAR(255) NOT NULL,
  Rtype VARCHAR(255) NOT NULL,
  msg VARCHAR(10000) NOT NULL,
  time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notification (
  notify_id INT AUTO_INCREMENT PRIMARY KEY,
  notify_sub VARCHAR(255) NOT NULL,
  notify_desc VARCHAR(255) NOT NULL,
  unseen INT NOT NULL,
  priority VARCHAR(255) NOT NULL,
  time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  entity_id VARCHAR(255) DEFAULT NULL,
  entity_type VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS states (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  state_id VARCHAR(45) NOT NULL,
  state_name VARCHAR(255) NOT NULL,
  state_code VARCHAR(100) DEFAULT NULL,
  state_timezone VARCHAR(255) NOT NULL,
  created_by VARCHAR(45) DEFAULT NULL,
  updated_by VARCHAR(45) DEFAULT NULL,
  created_date DATE DEFAULT NULL,
  updated_date DATE DEFAULT NULL,
  is_deleted TINYINT(1) NULL DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS support (
  tokenId INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(1000) NOT NULL,
  subject VARCHAR(1000) NOT NULL,
  screenshot VARCHAR(1000) NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  explanation VARCHAR(1000) NOT NULL,
  email VARCHAR(256) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS territories (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  territory_id VARCHAR(45) NOT NULL,
  state_id VARCHAR(45) DEFAULT NULL,
  territory_name VARCHAR(1000) NOT NULL,
  territory_code VARCHAR(1000) NOT NULL,
  manager_name VARCHAR(1000) NOT NULL,
  manager_phone VARCHAR(1000) NOT NULL,
  manager_email VARCHAR(1000) NOT NULL,
  contractor_name VARCHAR(1000) NOT NULL,
  contractor_phone VARCHAR(1000) NOT NULL,
  contractor_email VARCHAR(1000) NOT NULL,
  comments VARCHAR(1000) NOT NULL,
  created_by VARCHAR(45) NOT NULL,
  updated_by VARCHAR(45) DEFAULT NULL,
  created_date DATE DEFAULT NULL,
  updated_date DATE DEFAULT NULL,
  is_deleted TINYINT(1) NULL DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS territory_lab (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  territory_id VARCHAR(45) NOT NULL,
  lab_id VARCHAR(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS job_board_pickup (
  id INT(11) NOT NULL AUTO_INCREMENT,
  job_pickup_id VARCHAR(45) DEFAULT NULL,
  trip_stop_id VARCHAR(45) DEFAULT NULL,
  pickuptime DATETIME DEFAULT NULL,
  photo LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin CHECK (json_valid(photo)),
  roomtemp INT(11) NOT NULL DEFAULT 0,
  refrigeratedtemp INT(11) NOT NULL DEFAULT 0,
  hh INT(11) NOT NULL DEFAULT 0,
  bck INT(11) NOT NULL DEFAULT 0,
  other VARCHAR(100) DEFAULT NULL,
  h2o INT(11) DEFAULT 0,
  pickupfrom VARCHAR(100) DEFAULT NULL,
  labstaff VARCHAR(100) DEFAULT NULL,
  supplies VARCHAR(100) DEFAULT NULL,
  checklock INT(11) NOT NULL DEFAULT 0,
  comment LONGTEXT DEFAULT NULL,
  pickuplocation VARCHAR(255) DEFAULT NULL,
  timezone VARCHAR(100) DEFAULT NULL,
  ambient INT(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS job_board_dropoff (
  id INT(11) NOT NULL AUTO_INCREMENT,
  job_dropoff_id VARCHAR(45) DEFAULT NULL,
  trip_stop_id VARCHAR(45) DEFAULT NULL,
  delivery VARCHAR(100) DEFAULT NULL,
  airline VARCHAR(100) DEFAULT NULL,
  flightnum TEXT DEFAULT NULL,
  totalweight VARCHAR(100) DEFAULT NULL,
  airbill TEXT DEFAULT NULL,
  bags INT(11) NOT NULL DEFAULT 0,
  boxes INT(11) NOT NULL DEFAULT 0,
  bck1 INT(11) NOT NULL DEFAULT 0,
  other1 VARCHAR(100) DEFAULT NULL,
  h2o1 INT(11) NOT NULL DEFAULT 0,
  receipt LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin CHECK (json_valid(receipt)),
  transfer_to VARCHAR(100) DEFAULT NULL,
  delivery_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  location VARCHAR(100) DEFAULT NULL,
  timezone VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE IF NOT EXISTS job_board (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  job_id VARCHAR(45) NOT NULL,
  Job_num VARCHAR(100) DEFAULT NULL,
  state VARCHAR(45) NOT NULL,
  territory VARCHAR(45) NOT NULL,
  lab VARCHAR(45) NOT NULL,
  d_pickup_id VARCHAR(45) DEFAULT NULL,
  d_dropoff_id VARCHAR(45) DEFAULT NULL,
  pickup_id VARCHAR(45) DEFAULT NULL,
  pickup_stop VARCHAR(255) DEFAULT NULL,
  pickup_address VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  dropoff_id VARCHAR(45) DEFAULT NULL,
  dropoff_stop VARCHAR(255) DEFAULT NULL,
  dropoff_address VARCHAR(255) DEFAULT NULL,
  nop INT(11) DEFAULT 1,
  job_status ENUM('pending','confirmed','assigned','pickedup','intransit','delivered','completed','cancelled' , 'attempted') NOT NULL DEFAULT 'pending',
  job_type VARCHAR(255) DEFAULT NULL,
  job_date TIMESTAMP NULL DEFAULT NULL,
  created_by VARCHAR(45) NOT NULL,
  updated_by VARCHAR(45) DEFAULT NULL,
  driver VARCHAR(45) DEFAULT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  payable INT(11) NOT NULL DEFAULT 0,
  pay_comment TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS custom_job_location (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  job_board_id VARCHAR(45) NOT NULL,
  location VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id VARCHAR(45) NOT NULL,
  trip_name varchar(255) DEFAULT NULL,
  driver_id VARCHAR(45) NOT NULL,
  start_time DATETIME DEFAULT NULL,
  end_time DATETIME DEFAULT NULL,
  status VARCHAR(50) DEFAULT NULL,
  date DATE DEFAULT NULL,
  notes TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS trip_optimized_routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id VARCHAR(45) NOT NULL,
  stops_hash VARCHAR(32) NOT NULL COMMENT 'MD5 hash of stops data for change detection',
  optimized_points LONGTEXT DEFAULT NULL COMMENT 'Google Maps polyline points',
  optimized_order LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin 
    NOT NULL COMMENT 'Array of stop IDs in optimized order (JSON string)',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) 
ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COMMENT='Cached optimized routes to reduce Google API calls';


CREATE TABLE IF NOT EXISTS trip_stops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_stops_id VARCHAR(45) NOT NULL,
  trip_id VARCHAR(45) NOT NULL,
  stop_name VARCHAR(255) DEFAULT NULL,
  stop_address TEXT DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  status VARCHAR(50) DEFAULT NULL,
  reached_at DATETIME DEFAULT NULL,
  entity_type VARCHAR(255) DEFAULT NULL,
  sub_type VARCHAR(255) DEFAULT NULL,
  custom_order VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS trip_stop_jobs (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  trip_stop_jobs_id VARCHAR(45) NOT NULL,
  trip_stops_id VARCHAR(45) NOT NULL,
  job_id VARCHAR(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(45) NOT NULL,
  first_name VARCHAR(255) DEFAULT NULL,
  last_name VARCHAR(255) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(255) DEFAULT NULL,
  time_zone VARCHAR(255) DEFAULT NULL,
  territory VARCHAR(45) DEFAULT NULL,
  lab_id LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  created_by VARCHAR(45) DEFAULT NULL,
  updated_by VARCHAR(45) DEFAULT NULL,
  created_date DATE DEFAULT NULL,
  updated_date DATE DEFAULT NULL,
  is_deleted TINYINT(1) NULL DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  socket_broad VARCHAR(255) DEFAULT NULL,
  socket_individual VARCHAR(255) DEFAULT NULL,
  isOnline TINYINT(1) DEFAULT 0,
  is_agreed TINYINT(1) DEFAULT 0,
  login_attempts INT NULL,
  lock_until DATETIME DEFAULT NULL,
  expoPushToken VARCHAR(255) DEFAULT NULL,
  supplies LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS broadcast_message_reads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL,
  user_id VARCHAR(45) NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_message_user (message_id, user_id),
  KEY idx_message_id (message_id),
  KEY idx_user_id (user_id),
  CONSTRAINT fk_bmr_message FOREIGN KEY (message_id) REFERENCES broadcast_messages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(45) NOT NULL,
  modules LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (JSON_VALID(modules)),
  way LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (JSON_VALID(way)),
  actions LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (JSON_VALID(actions)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_agreements (
  agreement_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(45) NOT NULL,
  agreement_text TEXT NOT NULL,
  signature LONGTEXT NOT NULL,
  agreed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_access_clinic (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(45) DEFAULT NULL,
  user_access_id VARCHAR(45) NOT NULL,
  clinic_id VARCHAR(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_access_territory (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(45) DEFAULT NULL,
  user_access_id VARCHAR(45) NOT NULL,
  territory_id VARCHAR(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_data (
  data_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) DEFAULT NULL,
  email VARCHAR(1000) DEFAULT NULL,
  email2 VARCHAR(1000) DEFAULT NULL,
  scndPhone VARCHAR(1000) DEFAULT NULL,
  address1 VARCHAR(255) DEFAULT NULL,
  city VARCHAR(255) DEFAULT NULL,
  state1 VARCHAR(255) DEFAULT NULL,
  zip VARCHAR(255) DEFAULT NULL,
  ship_address1 VARCHAR(255) DEFAULT NULL,
  ship_address2 VARCHAR(255) DEFAULT NULL,
  ship_city VARCHAR(255) DEFAULT NULL,
  ship_state VARCHAR(255) DEFAULT NULL,
  ship_zip VARCHAR(255) DEFAULT NULL,
  nickName VARCHAR(255) DEFAULT NULL,
  ssn VARCHAR(255) DEFAULT NULL,
  DOB VARCHAR(255) DEFAULT NULL,
  emp_type VARCHAR(255) DEFAULT NULL,
  hire_date DATE DEFAULT NULL,
  term_date DATE DEFAULT NULL,
  emergency_name VARCHAR(255) DEFAULT NULL,
  emergency_phone VARCHAR(255) DEFAULT NULL,
  relationship VARCHAR(255) DEFAULT NULL,
  comment LONGTEXT DEFAULT NULL,
  tsa_verified VARCHAR(255) DEFAULT '0',
  tsaexpiry DATE DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS chat_media (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    media_type ENUM('image', 'video') NOT NULL,
    file_size INT(11) DEFAULT NULL,
    mime_type VARCHAR(100) DEFAULT NULL,
    conversation_id VARCHAR(100) NOT NULL COMMENT 'Format: userA_userB where smaller ID comes first',
    uploaded_by VARCHAR(45) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


    CREATE TABLE supplies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplies_id VARCHAR(50) NOT NULL UNIQUE,
    s_name VARCHAR(255) NOT NULL,
    s_code VARCHAR(100) NOT NULL,
    created_by VARCHAR(255) NULL,
    updated_by VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

    CREATE TABLE IF NOT EXISTS teams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      team_name VARCHAR(255) NOT NULL,
      lead_driver_id VARCHAR(45) NOT NULL,
      created_by VARCHAR(45) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS team_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      team_id INT NOT NULL,
      user_id VARCHAR(45) NOT NULL,
      INDEX (team_id),
      INDEX (user_id),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE supplies_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        supplies_history_id VARCHAR(50) NOT NULL UNIQUE,
        supplies_id VARCHAR(50) NOT NULL,
        s_name VARCHAR(50) DEFAULT NULL,
        s_code VARCHAR(50) DEFAULT NULL,
        driver_id VARCHAR(50) NOT NULL,
        quantity INT NOT NULL,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255) NULL,
        updated_by VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

      CREATE TABLE route_stop (
          id INT AUTO_INCREMENT PRIMARY KEY,
          route_stop_id VARCHAR(45) NOT NULL,
          route_id VARCHAR(45) NOT NULL,
          stop_type ENUM('CLINIC', 'DELIVERY') NOT NULL,
          ClinicId VARCHAR(45) NULL,
          DeliveryId VARCHAR(45) NULL,
          pickup_stop VARCHAR(255) NULL,
          pickup_address VARCHAR(255) NULL,
          dropoff_stop VARCHAR(255) NULL,
          dropoff_address VARCHAR(255) NULL,
          stop_order VARCHAR(45) NOT NULL,
          delivery_group VARCHAR(45) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS schedule_routes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            route_id VARCHAR(45) NOT NULL,
            route_name VARCHAR(1000) NOT NULL,
            territory_id VARCHAR(45) NOT NULL,
            day_week LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (JSON_VALID(day_week)),
            assigned_driver VARCHAR(45) DEFAULT NULL,
            assigned_at DATE DEFAULT NULL,
            is_temporary TINYINT(1) NOT NULL,
            temp_day LONGTEXT DEFAULT NULL,
            is_active TINYINT(1) DEFAULT 1,
            on_demand TINYINT(4) DEFAULT 0,
            is_deleted TINYINT(1) NULL DEFAULT 0,
            comments LONGTEXT DEFAULT NULL,
            created_by VARCHAR(45) NOT NULL,
            updated_by VARCHAR(45) DEFAULT NULL,
            created_date DATE DEFAULT NULL,
            updated_date DATE DEFAULT NULL
          );


    CREATE INDEX idx_jobboard_deleted_jobdate_created
    ON job_board (is_deleted, job_date, created_at DESC);

    CREATE INDEX idx_jobboard_feed
    ON job_board (
      is_deleted,
      territory,
      job_date,
      is_archived,
      created_at DESC
    );

    CREATE INDEX idx_tsj_job_id ON trip_stop_jobs (job_id);

    CREATE INDEX idx_tsj_trip_stops_id ON trip_stop_jobs (trip_stops_id);

    CREATE INDEX idx_ts_trip_id ON trip_stops (trip_id);

    CREATE INDEX idx_ts_entity_type ON trip_stops (entity_type);

    CREATE INDEX idx_custom_job_location ON custom_job_location (job_board_id);

    CREATE UNIQUE INDEX idx_users_email ON users(email);
    
    CREATE INDEX idx_user_data_user_id ON user_data(user_id);

`;