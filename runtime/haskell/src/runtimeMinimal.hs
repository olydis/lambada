
-- Abstract Syntax
data Expression = App Expression Expression | U
instance Show Expression where
  show (App f a)   = "(" ++ show f ++ " " ++ show a ++ ")"
  show U           = "u"

-- Semantics
valueOf :: Expression -> Expression
valueOf x = maybe x valueOf $ reduce x

reduce :: Expression -> Maybe Expression
reduce (App U (App U (App U U)))                                 = Nothing
reduce (App (App (App U (App U (App U U))) a) b)                 = Just $ a
reduce (App U (App U (App U (App U U))))                         = Nothing
reduce (App (App (App (App U (App U (App U (App U U)))) a) b) c) = Just $ App (App a c) (App b c)
reduce (App U a)                                                 = Just $ App (App a (App U (App U (App U (App U U))))) (App U (App U (App U U)))
reduce (App f a)                                                 = fmap (\f' -> App f' a) (reduce f)
reduce _                                                         = Nothing



-- Playground
i = App U U
k = App U (App U i)
s = App U k