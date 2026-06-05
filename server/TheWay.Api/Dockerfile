FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY ["TheWay.Api.csproj", "./"]
RUN dotnet restore "TheWay.Api.csproj"

# Copy everything else and build
COPY . .
RUN dotnet publish "TheWay.Api.csproj" -c Release -o /app/out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

# Expose port 8080 (Railway default)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "TheWay.Api.dll"]
