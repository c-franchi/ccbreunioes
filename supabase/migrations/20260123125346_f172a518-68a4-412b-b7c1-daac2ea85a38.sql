-- Adicionar política de DELETE para meeting_sessions
CREATE POLICY "Anyone can delete meeting sessions" 
ON public.meeting_sessions 
FOR DELETE 
USING (true);