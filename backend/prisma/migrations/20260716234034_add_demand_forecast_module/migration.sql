-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "columns" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandModel" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parameters" JSONB NOT NULL,
    "featureColumns" JSONB NOT NULL,
    "targetColumn" TEXT NOT NULL,
    "mae" DOUBLE PRECISION,
    "rmse" DOUBLE PRECISION,
    "r2Score" DOUBLE PRECISION,
    "trainRowCount" INTEGER NOT NULL,
    "validationRowCount" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "trainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandForecast" (
    "id" TEXT NOT NULL,
    "modelId" TEXT,
    "forDate" TIMESTAMP(3) NOT NULL,
    "hour" INTEGER NOT NULL,
    "category" TEXT,
    "predictedOrders" DOUBLE PRECISION NOT NULL,
    "actualOrders" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandForecast_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DemandModel" ADD CONSTRAINT "DemandModel_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandForecast" ADD CONSTRAINT "DemandForecast_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "DemandModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
