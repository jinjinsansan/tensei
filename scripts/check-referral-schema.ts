#!/usr/bin/env tsx

/**
 * Referral Program Schema Verification Script
 * 
 * このスクリプトは、紹介プログラムに必要なデータベーススキーマが
 * 正しくセットアップされているか確認します。
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import type { Database } from '../src/types/database';

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
}

loadEnvFile();

async function checkReferralSchema() {
  console.log('🔍 Checking referral program schema...\n');
  
  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.log('   Required environment variables:');
    console.log('   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('\n   Make sure .env.local file exists and contains these values.');
    process.exit(1);
  }
  
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);
  let hasErrors = false;

  // Check referral_claims table structure
  console.log('📋 Checking referral_claims table...');
  const { data: claimsColumns, error: claimsError } = await supabase
    .from('referral_claims')
    .select('*')
    .limit(1);

  if (claimsError) {
    console.error('❌ Error querying referral_claims:', claimsError.message);
    hasErrors = true;
  } else {
    console.log('✅ referral_claims table exists');
    
    // Check required columns by trying to select them
    const { error: columnsError } = await supabase
      .from('referral_claims')
      .select('id, referral_code_id, invited_user_id, referrer_reward_tickets, referee_reward_tickets, status, granted_at, created_at')
      .limit(1);
    
    if (columnsError) {
      console.error('❌ Missing columns in referral_claims:', columnsError.message);
      console.log('\n📝 Required columns:');
      console.log('   - id');
      console.log('   - referral_code_id');
      console.log('   - invited_user_id');
      console.log('   - referrer_reward_tickets (might be missing!)');
      console.log('   - referee_reward_tickets (might be missing!)');
      console.log('   - status');
      console.log('   - granted_at');
      console.log('   - created_at');
      hasErrors = true;
    } else {
      console.log('✅ All required columns exist in referral_claims');
    }
  }

  // Check referral_codes table
  console.log('\n📋 Checking referral_codes table...');
  const { error: codesError } = await supabase
    .from('referral_codes')
    .select('id, app_user_id, code, usage_limit, uses, created_at')
    .limit(1);

  if (codesError) {
    console.error('❌ Error querying referral_codes:', codesError.message);
    hasErrors = true;
  } else {
    console.log('✅ referral_codes table exists with all required columns');
  }

  // Check referral_settings table
  console.log('\n📋 Checking referral_settings table...');
  const { data: settings, error: settingsError } = await supabase
    .from('referral_settings')
    .select('id, referrer_ticket_amount, referee_ticket_amount, ticket_code')
    .eq('id', 'global')
    .maybeSingle();

  if (settingsError) {
    console.error('❌ Error querying referral_settings:', settingsError.message);
    hasErrors = true;
  } else if (!settings) {
    console.warn('⚠️  No global referral settings found. Will be created on first use.');
  } else {
    console.log('✅ referral_settings table exists with global settings');
    console.log(`   - Referrer reward: ${settings.referrer_ticket_amount} tickets`);
    console.log(`   - Referee reward: ${settings.referee_ticket_amount} tickets`);
    console.log(`   - Ticket code: ${settings.ticket_code}`);
  }

  // Check friends table
  console.log('\n📋 Checking friends table...');
  const { error: friendsError } = await supabase
    .from('friends')
    .select('id, user_id, friend_user_id, created_at')
    .limit(1);

  if (friendsError) {
    console.error('❌ Error querying friends:', friendsError.message);
    hasErrors = true;
  } else {
    console.log('✅ friends table exists with all required columns');
  }

  // Check app_users for referral columns
  console.log('\n📋 Checking app_users referral columns...');
  const { error: usersError } = await supabase
    .from('app_users')
    .select('id, referral_blocked, referred_by_user_id')
    .limit(1);

  if (usersError) {
    console.error('❌ Error querying app_users referral columns:', usersError.message);
    hasErrors = true;
  } else {
    console.log('✅ app_users has referral_blocked and referred_by_user_id columns');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (hasErrors) {
    console.log('❌ Schema verification FAILED');
    console.log('\n📝 To fix this issue:');
    console.log('   1. Run the migration: 20260219_referral_program.sql');
    console.log('   2. Or run the complete schema: 00_complete_schema.sql');
    console.log('   3. Make sure your database connection has proper permissions');
    process.exit(1);
  } else {
    console.log('✅ Schema verification PASSED');
    console.log('   All required tables and columns exist.');
  }
  console.log('='.repeat(60));
}

checkReferralSchema().catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
