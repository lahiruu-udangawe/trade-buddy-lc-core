ALTER TABLE public.import_lcs REPLICA IDENTITY FULL;
ALTER TABLE public.export_lcs REPLICA IDENTITY FULL;
ALTER TABLE public.import_wo_lcs REPLICA IDENTITY FULL;
ALTER TABLE public.export_wo_lcs REPLICA IDENTITY FULL;
ALTER TABLE public.guarantees REPLICA IDENTITY FULL;
ALTER TABLE public.swift_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.import_lcs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.export_lcs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.import_wo_lcs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.export_wo_lcs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.guarantees; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.swift_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;