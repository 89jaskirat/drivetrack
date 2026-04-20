-- Migration 004: Admin write policies
-- Allows cityAdmin and superAdmin users to manage zones, gas stations,
-- gas prices, articles, and moderate posts/comments via their user JWT.
-- This avoids needing the service-role key exposed in the browser.

CREATE POLICY "Admins can manage zones" ON zones
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cityAdmin', 'superAdmin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cityAdmin', 'superAdmin'))
  );

CREATE POLICY "Admins can manage gas stations" ON gas_stations
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cityAdmin', 'superAdmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cityAdmin', 'superAdmin')));

CREATE POLICY "Admins can manage gas prices" ON gas_price_entries
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cityAdmin', 'superAdmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cityAdmin', 'superAdmin')));

CREATE POLICY "Admins can manage articles" ON knowledge_articles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cityAdmin', 'superAdmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cityAdmin', 'superAdmin')));

CREATE POLICY "Admins can moderate posts" ON posts
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cityAdmin', 'superAdmin')));

CREATE POLICY "Admins can moderate comments" ON comments
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cityAdmin', 'superAdmin')));
