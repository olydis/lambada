
-- Abstract Syntax
data Expression = App Expression Expression | U | S | K | Probe String
instance Show Expression where
  show (App f a)   = "(" ++ show f ++ " " ++ show a ++ ")"
  show U           = "u"
  show S           = "s"
  show K           = "k"
  show (Probe s)   = s

-- Semantics
valueOf :: Expression -> Expression
valueOf x = maybe x valueOf $ reduce x

reduce :: Expression -> Maybe Expression
reduce (App (App K a) b)         = Just $ a
reduce (App (App (App S a) b) c) = Just $ App (App a c) (App b c)
reduce (App U a)                 = Just $ App (App a S) K
reduce (App f a)                 = fmap (\f' -> App f' a) (reduce f)
reduce _                         = Nothing


-- Playground
type Env = String -> Maybe Expression

envInitial :: Env
envInitial "u" = Just U
envInitial _   = Nothing

envAdd :: String -> Expression -> Env -> Env
envAdd name value env query = if query == name then Just value else env query

envParse :: String -> Env -> Env
envParse 

i = App U U
k = App U (App U i)
s = App U k