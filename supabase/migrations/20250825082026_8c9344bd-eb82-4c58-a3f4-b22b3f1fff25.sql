-- Add foreign key relationships for bar tab tables
ALTER TABLE user_bar_tabs 
ADD CONSTRAINT fk_user_bar_tabs_production 
FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE;

ALTER TABLE bar_tabs 
ADD CONSTRAINT fk_bar_tabs_production 
FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE;

ALTER TABLE bar_tab_transactions 
ADD CONSTRAINT fk_bar_tab_transactions_user_bar_tab 
FOREIGN KEY (user_bar_tab_id) REFERENCES user_bar_tabs(id) ON DELETE CASCADE;

ALTER TABLE bar_tab_transactions 
ADD CONSTRAINT fk_bar_tab_transactions_bar_tab 
FOREIGN KEY (bar_tab_id) REFERENCES bar_tabs(id) ON DELETE CASCADE;