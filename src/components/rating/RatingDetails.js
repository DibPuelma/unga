import { Box, Button, Rating, Stack, Typography } from "@mui/material";
import axios from "axios";
import moment from "moment-timezone";
import { useEffect, useState } from "react";
import useSWR from "swr";
import _ from 'lodash';
import Avatar from "../user/Avatar";
import UngaCircularProgress from "../utils/UngaCircularProgress";
import UngaError from "../utils/UngaError";

export default function RatingDetails({ avgRating, name, path }) {
  const { data: response, error } = useSWR(path, axios);
  const [reviewsCountByRating, setReviewsCountByRating] = useState(null);
  const [allReviews, setAllReviews] = useState(0);
  const [toShow, setToShow] = useState(3);

  useEffect(() => {
    if (response) {
      setAllReviews(response.data);
      const range = _.range(1, 6).reverse();
      const newReviewsByRating = range.reduce((acc, rating) => {
        acc[rating] = 0;
        return acc;
      }, {})
      response.data.forEach((review) => {
        const rating = review.rating;
        newReviewsByRating[rating] += 1;
      })

      setReviewsCountByRating(newReviewsByRating);
    }

  }, [response])

  if (!reviewsCountByRating) return <UngaCircularProgress />
  if (error) return <UngaError text={`No pudimos traer las reseñas para ${name}`} />

  return (
    <Stack alignItems="center">
      <Typography textAlign="center">Reseñas</Typography>
      <Typography variant="h6" textAlign="center" gutterBottom>{name}</Typography>
      <Typography variant="h3"><b>{avgRating.toFixed(1)}</b></Typography>
      <Rating defaultValue={avgRating.toFixed(1)} precision={0.1} readOnly />
      <Typography variant="caption" mb={2}>Basado en {allReviews.length} reseñas</Typography>
      <Stack width="100%" mb={4}>
        {Object.entries(reviewsCountByRating).reverse().map(([rating, count]) => (
          <Stack key={rating} direction="row" columnGap={1} alignItems="center">
            <Typography variant="body2" width="25%">{rating} {rating > 1 ? 'estrellas' : 'estrella'}</Typography>
            <Box height={8} width="75%" position="relative">
              <Box height={8} sx={(theme) => ({ backgroundColor: theme.palette.grey[300] })} width="100%" position="absolute" top={0} left={0} />
              <Box height={8} width={`${count / allReviews.length * 100}%`} sx={{ backgroundColor: '#faaf00' }} position="absolute" top={0} left={0} />
            </Box>
          </Stack>
        ))}
      </Stack>
      <Stack width="100%" rowGap={3}>
        {allReviews.slice(0, toShow).map((review) => {
          const user = review.user;
          return (
            <Stack key={review.id} rowGap={1}>
              <Stack direction="row" alignItems="center" columnGap={2}>
                <Avatar user={user} />
                <Stack width="100%">
                  <Stack direction="row" justifyContent="space-between" width="100%">
                    <Typography>{user.firstName}</Typography>
                    <Rating defaultValue={review.rating} readOnly size="small" />
                  </Stack>
                  <Typography variant="caption" color="GrayText">
                    {moment(review.createdAt).format('DD MMMM YYYY')}
                  </Typography>
                </Stack>
              </Stack>
              <Typography color="GrayText" variant="body2">{review.answer}</Typography>
            </Stack>
          )
        })}
        {toShow >= allReviews.length ? (
          <Typography variant="caption" color="GrayText">Estas son todas las reseñas</Typography>
        ) : (
          <Button variant="text" onClick={() => setToShow((oldValue) => oldValue + 3)}>Ver más</Button>
        )}
      </Stack>

    </Stack>
  )
}