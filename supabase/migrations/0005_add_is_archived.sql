-- Migration: Add is_archived column to analyses table
-- Purpose: Enable dashboard filtering and archiving of leads
-- Phase: 05-dashboard, Plan: 01

ALTER TABLE analyses ADD COLUMN is_archived boolean NOT NULL DEFAULT false;
