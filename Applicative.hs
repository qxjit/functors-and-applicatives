module Applicative where

import Control.Applicative
import Control.Concurrent
import Data.Time

main :: IO ()
main = do
  putStrLn "-- List Applicative --"
  print (pure (+) <*> [1,2] <*> [3,4])

  putStrLn "-- Maybe Applicative --"
  print (pure (+) <*> Just 1 <*> Just 2)
  print (pure (+) <*> Nothing <*> Just 2)
  print (pure (+) <*> Just 1 <*> Nothing)

  putStrLn "-- Async Applicative --"
  time <- runAsync $
    measureTime (pure (+) <*> delay 3000 1 <*> delay 3000 2)

  putStrLn ("Async ran in in " ++ show time)

newtype Async a = Async { runAsync :: IO a }

instance Functor Async where
  fmap f async = Async (f <$> runAsync async)

instance Applicative Async where
  pure a = Async (pure a)
  asyncF <*> asyncA = Async $ do
    fVar <- newEmptyMVar

    forkIO $ runAsync asyncF >>= putMVar fVar

    a <- runAsync asyncA
    f <- takeMVar fVar

    pure (f a)

delay :: Int -> a -> Async a
delay millis a = Async $ do
  threadDelay (millis * 1000)
  return a

measureTime :: Async a -> Async NominalDiffTime
measureTime async = Async $ do
  start <- getCurrentTime
  runAsync async
  end <- getCurrentTime
  return (end `diffUTCTime` start)

