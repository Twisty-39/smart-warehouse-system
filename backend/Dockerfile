# ==============================================================================
# Multi-stage Dockerfile for ASP.NET Core 10 Web API
# ==============================================================================

# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies (caching layer)
COPY ["SmartWarehouse.Api/SmartWarehouse.Api.csproj", "SmartWarehouse.Api/"]
RUN dotnet restore "SmartWarehouse.Api/SmartWarehouse.Api.csproj"

# Copy entire source code and build
COPY . .
WORKDIR "/src/SmartWarehouse.Api"
RUN dotnet build "SmartWarehouse.Api.csproj" -c Release -o /app/build

# Publish release bundle
FROM build AS publish
RUN dotnet publish "SmartWarehouse.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Final Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 5000

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

# Create uploads folder
RUN mkdir -p /app/wwwroot/uploads

COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "SmartWarehouse.Api.dll"]
