FROM golang:1.26-alpine AS build

WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend ./
RUN go build -o /out/training-service ./cmd/server

FROM alpine:3.20

RUN adduser -D -H training
USER training
COPY --from=build /out/training-service /training-service

EXPOSE 9000
ENTRYPOINT ["/training-service"]
