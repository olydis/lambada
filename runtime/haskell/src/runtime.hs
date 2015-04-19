
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


-- Environment

type Env = [(String, Expression)]

envInitial :: Env
envInitial = [("u", U)]

envAdd :: String -> Expression -> Env -> Env
envAdd name value []           = [(name, value)]
envAdd name value ((a, b):env) = if a == name then ((a, value):env) else (a, b):envAdd name value env

envGet :: String -> Env -> Expression
envGet name []           = error $ "no definition for " ++ name ++ " found"
envGet name ((a, b):env) = if a == name then b else envGet name env

envParse :: String -> Env -> Env
envParse s env = envParseBag [] Nothing Nothing s env

envParseBag :: [Expression] -> Maybe String -> Maybe String -> String -> Env -> Env
envParseBag []      Nothing  _        []           env = env
envParseBag _       _        _        []           env = error "unexpected end of input"
envParseBag stack   name     Nothing  (' '  : s)   env = envParseBag stack name Nothing s env
envParseBag stack   name     Nothing  ('\n' : s)   env = envParseBag stack name Nothing s env
envParseBag stack   name     Nothing  ('\r' : s)   env = envParseBag stack name Nothing s env
envParseBag []      _        Nothing  ('.'  : s)   env = error "unexpected application (stack was empty)"
envParseBag [e]     (Just n) Nothing  ('.'  : s)   env = envParseBag [] Nothing Nothing s (envAdd n e env)
envParseBag (b:a:e) name     Nothing  ('.'  : s)   env = envParseBag (App a b : e) name Nothing s env
 
envParseBag stack   Nothing  (Just x) t@(' '  : s) env = envParseBag stack (Just x) Nothing t env
envParseBag stack   Nothing  (Just x) t@('\n' : s) env = envParseBag stack (Just x) Nothing t env
envParseBag stack   Nothing  (Just x) t@('\r' : s) env = envParseBag stack (Just x) Nothing t env
envParseBag stack   Nothing  (Just x) t@('.'  : s) env = envParseBag stack (Just x) Nothing t env 

envParseBag stack   name     (Just x) t@(' '  : s) env = envParseBag (envGet x env : stack) name Nothing t env
envParseBag stack   name     (Just x) t@('\n' : s) env = envParseBag (envGet x env : stack) name Nothing t env
envParseBag stack   name     (Just x) t@('\r' : s) env = envParseBag (envGet x env : stack) name Nothing t env
envParseBag stack   name     (Just x) t@('.'  : s) env = envParseBag (envGet x env : stack) name Nothing t env 

envParseBag stack   name     Nothing  t@(c : s)    env = envParseBag stack name (Just "") t env
envParseBag stack   name     (Just x) (c : s)      env = envParseBag stack name (Just (x ++ [c])) s env